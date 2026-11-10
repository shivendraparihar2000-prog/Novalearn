/**
 * Automated Test Suite for NovaLearn YouTube IFrame Player Integration.
 *
 * Verifies all 14 lifecycle and integrity behaviors required by Phase 4J-D Checkpoint C:
 * 1. Dynamic YouTube API script loading.
 * 2. Handling an API that is already loaded.
 * 3. Player initialization and onReady.
 * 4. PLAYING starts sampling.
 * 5. PAUSED stops sampling.
 * 6. BUFFERING stops sampling.
 * 7. ENDED stops sampling.
 * 8. Forward seeking does not generate watched intervals.
 * 9. Backward seeking does not generate watched intervals.
 * 10. Actual playback samples generate intervals.
 * 11. Custom controls call actual player methods.
 * 12. Teardown / destroy stops sampling and destroys player.
 * 13. Switching videos does not leak old player events or telemetry.
 * 14. Player errors do not generate progress.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  loadYouTubeIFrameAPI,
  createYouTubePlayerController,
  mergeIntervals,
  calculateUniqueWatched,
} from './youtubePlayerController.js';

describe('YouTube IFrame Player Controller Suite', () => {

  /**
   * Helper mock factory for YouTube IFrame API.
   */
  function createMockYT() {
    const instances = [];

    const YT = {
      PlayerState: {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5,
      },
      Player: class MockPlayer {
        constructor(containerId, config) {
          this.containerId = containerId;
          this.config = config;
          this.currentTime = 0;
          this.duration = 300;
          this.playbackRate = 1.0;
          this.isDestroyed = false;
          this.calls = {
            playVideo: 0,
            pauseVideo: 0,
            seekTo: [],
            setPlaybackRate: [],
            destroy: 0,
          };
          instances.push(this);
        }

        getCurrentTime() {
          return this.currentTime;
        }

        getDuration() {
          return this.duration;
        }

        playVideo() {
          this.calls.playVideo += 1;
        }

        pauseVideo() {
          this.calls.pauseVideo += 1;
        }

        seekTo(seconds, allowSeekAhead) {
          this.calls.seekTo.push({ seconds, allowSeekAhead });
          this.currentTime = seconds;
        }

        setPlaybackRate(rate) {
          this.calls.setPlaybackRate.push(rate);
          this.playbackRate = rate;
        }

        destroy() {
          this.calls.destroy += 1;
          this.isDestroyed = true;
        }
      },
    };

    return { YT, instances };
  }

  // -------------------------------------------------------------------------
  // 1. Dynamic Script Loading & Already-Loaded Handling
  // -------------------------------------------------------------------------

  it('1. Dynamically loads YouTube IFrame API and queues onYouTubeIframeAPIReady', async () => {
    let appendedScript = null;
    const mockDocument = {
      getElementById: (id) => null,
      createElement: (tag) => ({ id: '', src: '' }),
      head: {
        appendChild: (el) => { appendedScript = el; },
      },
    };
    globalThis.document = mockDocument;

    const mockWindow = {
      onYouTubeIframeAPIReady: null,
    };

    const loadPromise = loadYouTubeIFrameAPI(mockWindow);
    assert.ok(mockWindow.onYouTubeIframeAPIReady, 'Callback attached to window');
    assert.strictEqual(appendedScript?.id, 'yt-iframe-api-script');
    assert.strictEqual(appendedScript?.src, 'https://www.youtube.com/iframe_api');

    // Simulate script finishing loading
    mockWindow.YT = { Player: class {} };
    mockWindow.onYouTubeIframeAPIReady();

    const result = await loadPromise;
    assert.strictEqual(result, mockWindow.YT);
  });

  it('2. Resolves immediately when YouTube API is already loaded', async () => {
    const existingYT = { Player: class {}, PlayerState: {} };
    const mockWindow = {
      YT: existingYT,
    };

    const result = await loadYouTubeIFrameAPI(mockWindow);
    assert.strictEqual(result, existingYT);
  });

  // -------------------------------------------------------------------------
  // 3. Player Initialization and onReady Lifecycle
  // -------------------------------------------------------------------------

  it('3. Initializes player with container and triggers onReady callback', () => {
    const { YT, instances } = createMockYT();
    const mockWindow = { YT };
    let readyCalled = false;
    let reportedDuration = null;

    const controller = createYouTubePlayerController({
      videoId: 'test_vid_123',
      containerId: 'yt-container',
      startPosition: 45,
      windowObj: mockWindow,
      onReady: ({ duration }) => {
        readyCalled = true;
        reportedDuration = duration;
      },
    });

    const mockPlayer = instances[0];
    assert.ok(mockPlayer, 'Player instantiated');
    assert.strictEqual(mockPlayer.config.videoId, 'test_vid_123');

    // Trigger onReady event
    mockPlayer.config.events.onReady({ target: mockPlayer });
    assert.ok(readyCalled, 'onReady was fired');
    assert.strictEqual(reportedDuration, 300);
    assert.deepStrictEqual(mockPlayer.calls.seekTo, [{ seconds: 45, allowSeekAhead: true }]);
  });

  // -------------------------------------------------------------------------
  // 4, 5, 6, 7. State Transitions (PLAYING, PAUSED, BUFFERING, ENDED)
  // -------------------------------------------------------------------------

  it('4. PLAYING state starts sampling and sets isPlaying to true', () => {
    const { YT, instances } = createMockYT();
    let stateReported = null;

    const controller = createYouTubePlayerController({
      videoId: 'vid_play',
      windowObj: { YT },
      onStateChange: (data) => { stateReported = data; },
    });

    const mockPlayer = instances[0];
    mockPlayer.currentTime = 10;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });

    assert.strictEqual(stateReported.isPlaying, true);
    assert.strictEqual(stateReported.eventType, 'play');
    assert.strictEqual(controller.getState().isPlaying, true);

    controller.destroy();
  });

  it('5. PAUSED state stops sampling and sets isPlaying to false', () => {
    const { YT, instances } = createMockYT();
    let stateReported = null;

    const controller = createYouTubePlayerController({
      videoId: 'vid_pause',
      windowObj: { YT },
      onStateChange: (data) => { stateReported = data; },
    });

    const mockPlayer = instances[0];
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });
    mockPlayer.currentTime = 20;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PAUSED });

    assert.strictEqual(stateReported.isPlaying, false);
    assert.strictEqual(stateReported.eventType, 'pause');
    assert.strictEqual(controller.getState().isPlaying, false);

    controller.destroy();
  });

  it('6. BUFFERING state stops sampling and reports buffering event', () => {
    const { YT, instances } = createMockYT();
    let stateReported = null;

    const controller = createYouTubePlayerController({
      videoId: 'vid_buf',
      windowObj: { YT },
      onStateChange: (data) => { stateReported = data; },
    });

    const mockPlayer = instances[0];
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.BUFFERING });

    assert.strictEqual(stateReported.isPlaying, false);
    assert.strictEqual(stateReported.eventType, 'buffering');
    assert.strictEqual(controller.getState().isPlaying, false);

    controller.destroy();
  });

  it('7. ENDED state stops sampling and sets isPlaying to false', () => {
    const { YT, instances } = createMockYT();
    let stateReported = null;

    const controller = createYouTubePlayerController({
      videoId: 'vid_end',
      windowObj: { YT },
      onStateChange: (data) => { stateReported = data; },
    });

    const mockPlayer = instances[0];
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });
    mockPlayer.currentTime = 300;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.ENDED });

    assert.strictEqual(stateReported.isPlaying, false);
    assert.strictEqual(stateReported.eventType, 'ended');
    assert.strictEqual(controller.getState().isPlaying, false);

    controller.destroy();
  });

  // -------------------------------------------------------------------------
  // 8, 9, 10. Scrubbing vs Actual Playback Interval Sampling
  // -------------------------------------------------------------------------

  it('8. Forward seeking (delta > 3.0s) does not generate watched intervals', () => {
    const { YT, instances } = createMockYT();
    const controller = createYouTubePlayerController({
      videoId: 'vid_fwd_seek',
      windowObj: { YT },
    });

    const mockPlayer = instances[0];
    mockPlayer.currentTime = 10;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });

    // Jump 200s ahead (seeking)
    mockPlayer.currentTime = 210;
    controller.samplePlayback();

    const state = controller.getState();
    assert.deepStrictEqual(state.intervals, [], 'No interval generated for scrub jump');
    assert.strictEqual(state.uniqueWatched, 0);

    controller.destroy();
  });

  it('9. Backward seeking (delta < 0) does not generate watched intervals', () => {
    const { YT, instances } = createMockYT();
    const controller = createYouTubePlayerController({
      videoId: 'vid_back_seek',
      initialIntervals: [[0, 10]],
      windowObj: { YT },
    });

    const mockPlayer = instances[0];
    mockPlayer.currentTime = 50;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });

    // Jump backwards to 15s
    mockPlayer.currentTime = 15;
    controller.samplePlayback();

    const state = controller.getState();
    assert.strictEqual(state.uniqueWatched, 10, 'Unique watched remains unchanged');

    controller.destroy();
  });

  it('10. Actual playback samples generate continuous watched intervals', () => {
    const { YT, instances } = createMockYT();
    const controller = createYouTubePlayerController({
      videoId: 'vid_sample_legit',
      windowObj: { YT },
    });

    const mockPlayer = instances[0];
    mockPlayer.currentTime = 0;
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });

    // Sample 1: 0 to 1.0s
    mockPlayer.currentTime = 1.0;
    controller.samplePlayback();

    // Sample 2: 1.0 to 2.0s
    mockPlayer.currentTime = 2.0;
    controller.samplePlayback();

    // Sample 3: 2.0 to 3.0s
    mockPlayer.currentTime = 3.0;
    controller.samplePlayback();

    const state = controller.getState();
    assert.deepStrictEqual(state.intervals, [[0.0, 3.0]]);
    assert.strictEqual(state.uniqueWatched, 3.0);

    controller.destroy();
  });

  // -------------------------------------------------------------------------
  // 11. Custom Controls Call Actual Player Methods
  // -------------------------------------------------------------------------

  it('11. Custom controls (play, pause, seekTo, setPlaybackRate) call actual player methods', () => {
    const { YT, instances } = createMockYT();
    const controller = createYouTubePlayerController({
      videoId: 'vid_ctrl',
      windowObj: { YT },
    });

    const mockPlayer = instances[0];

    controller.playVideo();
    assert.strictEqual(mockPlayer.calls.playVideo, 1);

    controller.pauseVideo();
    assert.strictEqual(mockPlayer.calls.pauseVideo, 1);

    controller.seekTo(125, true);
    assert.deepStrictEqual(mockPlayer.calls.seekTo, [{ seconds: 125, allowSeekAhead: true }]);

    controller.setPlaybackRate(1.5);
    assert.deepStrictEqual(mockPlayer.calls.setPlaybackRate, [1.5]);

    controller.destroy();
  });

  // -------------------------------------------------------------------------
  // 12. Modal Close / Teardown
  // -------------------------------------------------------------------------

  it('12. Destroy stops sampling timer and calls player.destroy()', () => {
    const { YT, instances } = createMockYT();
    const controller = createYouTubePlayerController({
      videoId: 'vid_destroy',
      windowObj: { YT },
    });

    const mockPlayer = instances[0];
    mockPlayer.config.events.onStateChange({ data: YT.PlayerState.PLAYING });

    controller.destroy();

    assert.strictEqual(controller.getState().isDestroyed, true);
    assert.strictEqual(controller.getState().isPlaying, false);
    assert.strictEqual(mockPlayer.calls.destroy, 1);
  });

  // -------------------------------------------------------------------------
  // 13. Switching Videos Does Not Leak Events or Telemetry
  // -------------------------------------------------------------------------

  it('13. Switching videos tears down old instance without leaking state', () => {
    const { YT, instances } = createMockYT();

    // Instance 1
    const controller1 = createYouTubePlayerController({
      videoId: 'vid_first',
      windowObj: { YT },
    });
    const player1 = instances[0];
    player1.currentTime = 0;
    player1.config.events.onStateChange({ data: YT.PlayerState.PLAYING });
    player1.currentTime = 2.0;
    controller1.samplePlayback();

    assert.strictEqual(controller1.getState().uniqueWatched, 2.0);

    // Destroy instance 1
    controller1.destroy();
    assert.strictEqual(player1.calls.destroy, 1);

    // Instance 2
    const controller2 = createYouTubePlayerController({
      videoId: 'vid_second',
      windowObj: { YT },
    });
    const player2 = instances[1];
    assert.strictEqual(controller2.getState().uniqueWatched, 0, 'New instance starts fresh with 0 unique seconds');

    // Late event on old player1 does not impact controller2
    player1.currentTime = 100;
    controller1.samplePlayback(); // Should be no-op because destroyed

    assert.strictEqual(controller2.getState().uniqueWatched, 0);

    controller2.destroy();
  });

  // -------------------------------------------------------------------------
  // 14. Player Errors Do Not Generate Progress
  // -------------------------------------------------------------------------

  it('14. Player errors report error notice and do not accrue watch progress', () => {
    const { YT, instances } = createMockYT();
    let receivedError = null;

    const controller = createYouTubePlayerController({
      videoId: 'vid_err',
      windowObj: { YT },
      onError: (err) => { receivedError = err; },
    });

    const mockPlayer = instances[0];
    mockPlayer.config.events.onError({ data: 150 });

    assert.ok(receivedError, 'Error callback was triggered');
    assert.strictEqual(receivedError.errorCode, 150);
    assert.strictEqual(controller.getState().uniqueWatched, 0);

    controller.destroy();
  });

  // -------------------------------------------------------------------------
  // Mathematical Interval Union Helpers
  // -------------------------------------------------------------------------

  it('15. mergeIntervals and calculateUniqueWatched correctly merge overlapping, adjacent, and disjoint intervals', () => {
    const raw = [[0, 10], [5, 15], [20, 30], [25, 35], [35, 40], [50, 55]];
    const merged = mergeIntervals(raw);
    assert.deepStrictEqual(merged, [
      [0, 15],
      [20, 40],
      [50, 55],
    ]);
    const total = calculateUniqueWatched(raw);
    // (15 - 0) + (40 - 20) + (55 - 50) = 15 + 20 + 5 = 40
    assert.strictEqual(total, 40.0);
  });
});
