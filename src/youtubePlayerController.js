/**
 * Production YouTube IFrame Player Controller for NovaLearn.
 *
 * Encapsulates:
 * - Dynamic YouTube IFrame API script loading and readiness chaining.
 * - Player instance lifecycle (initialization, onReady, state transitions, teardown).
 * - High-integrity playback interval sampling and scrub filtering (delta <= 3.0s).
 * - Continuous interval mathematical union and unique watched time calculation.
 * - Binding to custom UI controls (play/pause, seek, playback rate).
 */

export const SAMPLING_INTERVAL_MS = 1000;
export const MAX_SCRUB_JUMP_SECONDS = 3.0;

/**
 * Merge an arbitrary list of [start, end] intervals into a sorted,
 * non-overlapping, continuous mathematical union.
 *
 * @param {Array<[number, number]>} intervals
 * @returns {Array<[number, number]>}
 */
export function mergeIntervals(intervals = []) {
  if (!Array.isArray(intervals) || intervals.length === 0) return [];

  const valid = intervals
    .filter(it => Array.isArray(it) && it.length >= 2)
    .map(([s, e]) => [Number(Number(s).toFixed(1)), Number(Number(e).toFixed(1))])
    .filter(([s, e]) => !isNaN(s) && !isNaN(e) && s <= e)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  if (valid.length === 0) return [];

  const merged = [];
  for (const it of valid) {
    if (!merged.length) {
      merged.push([...it]);
    } else {
      const last = merged[merged.length - 1];
      if (it[0] <= last[1]) {
        last[1] = Math.max(last[1], it[1]);
      } else {
        merged.push([...it]);
      }
    }
  }
  return merged.map(([s, e]) => [Number(s.toFixed(1)), Number(e.toFixed(1))]);
}

/**
 * Calculate the exact non-overlapping unique seconds watched across intervals.
 *
 * @param {Array<[number, number]>} intervals
 * @returns {number}
 */
export function calculateUniqueWatched(intervals = []) {
  const merged = mergeIntervals(intervals);
  const total = merged.reduce((acc, [s, e]) => acc + Math.max(0, e - s), 0);
  return Number(total.toFixed(1));
}

/**
 * Dynamically load the official YouTube IFrame Player API.
 * Safely chains existing callbacks and handles already-loaded instances.
 *
 * @param {object} [windowObj]
 * @returns {Promise<object>}
 */
export function loadYouTubeIFrameAPI(windowObj = (typeof window !== 'undefined' ? window : globalThis)) {
  return new Promise((resolve) => {
    if (windowObj.YT && windowObj.YT.Player) {
      return resolve(windowObj.YT);
    }

    const prevReady = windowObj.onYouTubeIframeAPIReady;
    windowObj.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') {
        try { prevReady(); } catch (_) {}
      }
      resolve(windowObj.YT);
    };

    if (typeof document !== 'undefined' && !document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      if (document.head) {
        document.head.appendChild(tag);
      }
    }
  });
}

/**
 * Create and manage an active YouTube IFrame Player instance.
 *
 * @param {object} options
 * @param {string} options.videoId
 * @param {string} [options.containerId='yt-player-container']
 * @param {number} [options.startPosition=0]
 * @param {Array<[number, number]>} [options.initialIntervals=[]]
 * @param {Function} [options.onReady]
 * @param {Function} [options.onStateChange]
 * @param {Function} [options.onError]
 * @param {Function} [options.onSample]
 * @param {object} [options.windowObj]
 * @param {number} [options.samplingIntervalMs=1000]
 * @param {number} [options.maxScrubJumpSeconds=3.0]
 * @returns {object} Controller instance
 */
export function createYouTubePlayerController(options = {}) {
  const {
    videoId,
    containerId = 'yt-player-container',
    startPosition = 0,
    initialIntervals = [],
    onReady = () => {},
    onStateChange = () => {},
    onError = () => {},
    onSample = () => {},
    windowObj = (typeof window !== 'undefined' ? window : globalThis),
    samplingIntervalMs = SAMPLING_INTERVAL_MS,
    maxScrubJumpSeconds = MAX_SCRUB_JUMP_SECONDS,
  } = options;

  let player = null;
  let isPlaying = false;
  let samplingTimer = null;
  let lastTime = null;
  let intervals = mergeIntervals(initialIntervals);
  let uniqueWatched = calculateUniqueWatched(intervals);
  let isDestroyed = false;
  let duration = null;

  const YTState = (windowObj.YT && windowObj.YT.PlayerState) || {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  };

  function stopSampling() {
    if (samplingTimer) {
      clearInterval(samplingTimer);
      samplingTimer = null;
    }
  }

  function samplePlayback() {
    if (isDestroyed || !isPlaying || !player) return;

    try {
      const curTime = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
      const prevTime = lastTime;
      lastTime = curTime;

      // Legitimate playback condition: time advanced forward within normal sampling bounds
      if (prevTime !== null && curTime > prevTime && (curTime - prevTime) <= maxScrubJumpSeconds) {
        const newSlice = [Number(prevTime.toFixed(1)), Number(curTime.toFixed(1))];
        intervals = mergeIntervals([...intervals, newSlice]);
        uniqueWatched = calculateUniqueWatched(intervals);

        onSample({
          currentTime: curTime,
          intervals,
          uniqueWatched,
        });
      } else {
        // Forward scrubbing, seeking, or backward jumps: update position only; DO NOT add watch time
        onSample({
          currentTime: curTime,
          intervals,
          uniqueWatched,
        });
      }
    } catch (_) {}
  }

  function startSampling() {
    stopSampling();
    samplingTimer = setInterval(samplePlayback, samplingIntervalMs);
  }

  function handleStateChange(eventData) {
    if (isDestroyed) return;

    if (eventData === YTState.PLAYING) {
      isPlaying = true;
      try {
        lastTime = typeof player?.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
      } catch (_) {
        lastTime = 0;
      }
      startSampling();
      onStateChange({
        state: eventData,
        isPlaying: true,
        currentTime: lastTime,
        intervals,
        uniqueWatched,
        eventType: 'play',
      });
    } else if (eventData === YTState.PAUSED) {
      isPlaying = false;
      stopSampling();
      const curPos = typeof player?.getCurrentTime === 'function' ? player.getCurrentTime() : (lastTime || 0);
      lastTime = curPos;
      onStateChange({
        state: eventData,
        isPlaying: false,
        currentTime: curPos,
        intervals,
        uniqueWatched,
        eventType: 'pause',
      });
    } else if (eventData === YTState.BUFFERING) {
      isPlaying = false;
      stopSampling();
      const curPos = typeof player?.getCurrentTime === 'function' ? player.getCurrentTime() : (lastTime || 0);
      onStateChange({
        state: eventData,
        isPlaying: false,
        currentTime: curPos,
        intervals,
        uniqueWatched,
        eventType: 'buffering',
      });
    } else if (eventData === YTState.ENDED) {
      isPlaying = false;
      stopSampling();
      const curPos = typeof player?.getCurrentTime === 'function' ? player.getCurrentTime() : (lastTime || 0);
      lastTime = curPos;
      onStateChange({
        state: eventData,
        isPlaying: false,
        currentTime: curPos,
        intervals,
        uniqueWatched,
        eventType: 'ended',
      });
    }
  }

  // Initialize YT.Player
  try {
    if (windowObj.YT && windowObj.YT.Player) {
      player = new windowObj.YT.Player(containerId, {
        videoId,
        playerVars: {
          enablejsapi: 1,
          origin: windowObj.location ? windowObj.location.origin : 'http://localhost',
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            if (isDestroyed) return;
            try {
              if (event.target && typeof event.target.getDuration === 'function') {
                duration = event.target.getDuration();
              }
              if (startPosition > 0 && event.target && typeof event.target.seekTo === 'function') {
                event.target.seekTo(startPosition, true);
                lastTime = startPosition;
              }
            } catch (_) {}

            onReady({
              duration,
              startPosition,
              target: event.target,
            });
          },
          onStateChange: (event) => {
            handleStateChange(event.data);
          },
          onError: (event) => {
            if (isDestroyed) return;
            onError({
              errorCode: event.data,
              message: `YouTube player error (code ${event.data}).`,
            });
          },
        },
      });
    }
  } catch (err) {
    onError({
      errorCode: -1,
      message: `Failed to initialize YouTube player: ${err.message}`,
    });
  }

  return {
    playVideo() {
      if (player && typeof player.playVideo === 'function') {
        player.playVideo();
      }
    },
    pauseVideo() {
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    },
    seekTo(seconds, allowSeekAhead = true) {
      lastTime = Number(seconds);
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(seconds, allowSeekAhead);
      }
    },
    setPlaybackRate(rate) {
      if (player && typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(Number(rate));
      }
    },
    destroy() {
      isDestroyed = true;
      isPlaying = false;
      stopSampling();
      if (player && typeof player.destroy === 'function') {
        try { player.destroy(); } catch (_) {}
      }
      player = null;
    },
    samplePlayback,
    handleStateChange,
    getState() {
      return {
        isPlaying,
        currentTime: lastTime || 0,
        intervals: [...intervals],
        uniqueWatched,
        duration,
        isDestroyed,
      };
    },
    getRawPlayer() {
      return player;
    },
  };
}
