// LearnMate API client. Talks to the Flask backend and adapts its responses to the
// shapes the UI components already render.
//
// Backend URL: set VITE_API_URL in frontend/.env (default http://localhost:5000/api).
// The backend's CORS_ORIGINS must include the origin Vite serves from (default http://localhost:5173).

/**
 * Resolves the backend API base URL with fail-closed production safety.
 *
 * In production:
 * - VITE_API_URL must be explicitly configured.
 * - Silent fallback to localhost is strictly prohibited.
 * - Missing VITE_API_URL produces a clear configuration error.
 *
 * In development / test:
 * - Falls back safely to 'http://localhost:5000/api'.
 * - Trailing slashes are normalized.
 */
export function resolveApiBaseUrl(env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {}) {
  const isProd = Boolean(env.PROD || env.MODE === 'production');
  const rawUrl = env.VITE_API_URL;

  if (isProd) {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      throw new Error('Configuration error: VITE_API_URL must be explicitly defined in production environment.');
    }
    return rawUrl.trim().replace(/\/+$/, '');
  }

  const fallback = (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) ? rawUrl.trim() : 'http://localhost:5000/api';
  return fallback.replace(/\/+$/, '');
}

let resolvedBaseUrl;
let baseConfigError = null;
try {
  resolvedBaseUrl = resolveApiBaseUrl();
} catch (err) {
  baseConfigError = err.message;
}

export function getBaseUrl() {
  if (baseConfigError) {
    throw new ApiError(0, 'configuration_error', baseConfigError);
  }
  return resolvedBaseUrl;
}

const KEY = 'learnmate.session';

/* ---------- session (JWT + user) ---------- */
export const session = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } },
};

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const s = session.get();
  if (auth && s?.token) headers.Authorization = `Bearer ${s.token}`;

  let res;
  try {
    const base = getBaseUrl();
    res = await fetch(base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server. Is the backend running?');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty / non-JSON body */ }

  if (!res.ok) {
    const e = data?.error || {};
    // Expired/invalid token on an authenticated call: drop the session and let the app react.
    if (auth && s && res.status === 401) { session.clear(); onUnauthorized(); }
    throw new ApiError(res.status, e.code || 'http_error', e.message || `Request failed (${res.status})`, e.details);
  }
  return data;
}

/* ---------- endpoints ---------- */
export const login = (identifier, password) =>
  request('/auth/login', { method: 'POST', auth: false, body: { username: identifier, password } });

export const googleLogin = (credential) =>
  request('/auth/google', { method: 'POST', auth: false, body: { credential } });

export const signup = (username, email, password) =>
  request('/auth/signup', { method: 'POST', auth: false, body: { username, email, password } });

export const getCoursePage = (page = 1, perPage = 50) => request(`/courses?page=${page}&per_page=${perPage}`);
export const getCourse = async (id) => (await request(`/courses/${id}`)).course; // includes quiz questions (no answers)

export const logActivity = (courseId, eventType, seconds) =>
  request('/activity', {
    method: 'POST',
    body: { course_id: courseId, event_type: eventType, ...(seconds ? { time_spent_seconds: seconds } : {}) },
  });

// answers: { [questionId]: chosenOptionIndex }
export const submitQuiz = (courseId, answers, seconds = 0) =>
  request('/quiz/submit', { method: 'POST', body: { course_id: courseId, answers, time_spent_seconds: seconds } });

export const getRecommendations = () => request('/recommendations');
export const refreshRecommendations = () => request('/recommendations/refresh', { method: 'POST' });
export const getProfile = async () => (await request('/profile')).profile;
export const updateProfile = async (profile) => (await request('/profile', { method: 'PATCH', body: profile })).profile;
export const getProfileTopics = async () => (await request('/profile/topics')).topics;
export const getKnowledgeProfile = () => request('/profile/knowledge?per_page=20');
export const getProgress = () => request('/progress?per_page=50'); // backend caps per_page at 50
export const getOnboarding = () => request('/onboarding');
export const getOnboardingStatus = () => request('/onboarding/status');
export const saveEducation = (education_category, school_grade) => request('/onboarding/education',{method:'POST',body:{education_category,school_grade}});
export const completeOnboarding = () => request('/onboarding/complete',{method:'POST',body:{}});
export const inviteGuardian = (guardian_email) => request('/guardian/invitations',{method:'POST',body:{guardian_email}});
export const getLearningRecommendations = ({ subject, category } = {}) => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (category) params.append('category', category);
  const q = params.toString();
  return request(`/recommendations/learning${q ? '?' + q : ''}`);
};
export const getKnowledgeCoverage = () => request('/profile/knowledge/coverage');
export const getKnowledgeHistory = (topicId) => request(`/profile/knowledge/topics/${topicId}/history`);

/* ---------- Phase 5B: Focus Mode & NovaBreak ---------- */
export const startFocusSession = (journeyId = null, activityId = null, customIntervalMinutes = null) =>
  request('/focus/sessions', { method: 'POST', body: { journey_id: journeyId, activity_id: activityId, custom_interval_minutes: customIntervalMinutes } });
export const getCurrentFocusSession = () => request('/focus/sessions/current');
export const startNovaBreak = (sessionId) => request(`/focus/sessions/${sessionId}/break/start`, { method: 'POST' });
export const endNovaBreak = (sessionId) => request(`/focus/sessions/${sessionId}/break/end`, { method: 'POST' });
export const heartbeatFocusSession = (sessionId, studySeconds = null) =>
  request(`/focus/sessions/${sessionId}/heartbeat`, { method: 'POST', body: { study_duration_seconds: studySeconds } });
export const completeFocusSession = (sessionId) => request(`/focus/sessions/${sessionId}/complete`, { method: 'POST' });
export const abandonFocusSession = (sessionId) => request(`/focus/sessions/${sessionId}/abandon`, { method: 'POST' });

/* ---------- Phase 5C: Guardian Experience & Reporting ---------- */
export const getGuardianLearners = () => request('/guardian/learners');
export const getGuardianLearnerSummary = (learnerId) => request(`/guardian/learners/${learnerId}/summary`);
export const getGuardianLearnerReports = (learnerId) => request(`/guardian/learners/${learnerId}/reports`);
export const generateGuardianReport = (learnerId) => request(`/guardian/learners/${learnerId}/reports/generate`, { method: 'POST' });
export const sendGuardianReport = (learnerId, reportId) => request(`/guardian/learners/${learnerId}/reports/${reportId}/send`, { method: 'POST' });
export const startDiagnostic = () => request('/diagnostic/sessions', { method: 'POST', body: {} });
export const getDiagnosticSession = (sessionId) => request(`/diagnostic/sessions/${sessionId}`);
export const getNextDiagnosticQuestion = (sessionId) => request(`/diagnostic/sessions/${sessionId}/next`);
export const submitDiagnosticAnswer = (sessionId, sessionQuestionId, selectedAnswerIndex) =>
  request(`/diagnostic/sessions/${sessionId}/answers`, { method: 'POST', body: { session_question_id: sessionQuestionId, selected_answer_index: selectedAnswerIndex } });
export const createLearningJourney = (body = {}) => request('/learning-journeys', { method: 'POST', body });
export const listLearningJourneys = () => request('/learning-journeys');
export const getLearningJourney = (journeyId) => request(`/learning-journeys/${journeyId}`);
export const getLearningJourneyVersions = (journeyId) => request(`/learning-journeys/${journeyId}/versions`);
export const adaptLearningJourney = (journeyId, adaptationReason = 'learner_progress_adaptation') =>
  request(`/learning-journeys/${journeyId}/adapt`, { method: 'POST', body: { adaptation_reason: adaptationReason } });
export const getJourneyProgress = (journeyId) => request(`/learning-journeys/${journeyId}/progress`);
export const startJourneyActivity = (journeyId, activityId) =>
  request(`/learning-journeys/${journeyId}/activities/${activityId}/start`, { method: 'POST' });
export const updateVideoPlayback = (journeyId, activityId, playbackData) =>
  request(`/learning-journeys/${journeyId}/activities/${activityId}/video-playback`, { method: 'POST', body: playbackData });
export const completeJourneyActivity = (journeyId, activityId, completionData = {}) =>
  request(`/learning-journeys/${journeyId}/activities/${activityId}/complete`, { method: 'POST', body: completionData });
export const getMilestoneAssessment = (journeyId, stepId) =>
  request(`/learning-journeys/${journeyId}/steps/${stepId}/milestone-assessment`);
export const submitMilestoneAssessment = (journeyId, stepId, submission) =>
  request(`/learning-journeys/${journeyId}/steps/${stepId}/milestone-assessment/submit`, { method: 'POST', body: submission });
export const getMilestoneResults = (journeyId, stepId) =>
  request(`/learning-journeys/${journeyId}/steps/${stepId}/milestone-assessment/results`);


export async function fetchAllCourses() {
  const out = [];
  for (let page = 1; page <= 20; page += 1) {
    const r = await getCoursePage(page, 50);
    out.push(...r.courses);
    if (!r.courses.length || out.length >= r.pagination.total) break;
  }
  return out;
}

/* ---------- adapters: backend -> UI shapes ---------- */
const TONES = ['violet', 'mint', 'amber', 'blue', 'pink'];
const TOPIC_TONE = { python: 'violet', 'data-structures': 'blue', statistics: 'amber', databases: 'pink', 'machine-learning': 'mint', 'web-development': 'violet' };
const TOPIC_ICON = { python: 'Py', 'data-structures': '⌘', statistics: '∑', databases: 'SQL', 'machine-learning': 'ML', 'web-development': '</>' };
const FORMAT_LABEL = { video: 'Video lesson', article: 'Reading', interactive: 'Interactive lesson', quiz: 'Quiz', project: 'Project' };

export const prettyTopic = (s = '') => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);
const hashTone = (s) => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

function base(c) {
  return {
    id: c.course_id,
    title: c.title,
    topic: prettyTopic(c.topic),
    topicKey: c.topic,
    level: cap(c.difficulty),
    type: FORMAT_LABEL[c.format] || cap(c.format),
    duration: 'Self-paced', // the backend does not store course length
    icon: TOPIC_ICON[c.topic] || prettyTopic(c.topic).slice(0, 2),
    tone: TOPIC_TONE[c.topic] || hashTone(c.topic),
  };
}

export const adaptCourse = (c) => ({ ...base(c), match: null, why: c.description || '', hasQuiz: !!c.has_quiz });

// score is a normalised 0..1 ranking score (not a calibrated probability).
export const adaptRecommendation = (r) => ({ ...base(r), match: Math.round(r.score * 100), why: r.reason, reasonCodes: r.reason_codes });

export function adaptMastery(topicMastery = {}) {
  return Object.entries(topicMastery)
    .map(([key, m]) => {
      const value = Math.round(m * 100);
      const state = value >= 70 ? 'Strong mastery' : value >= 50 ? 'Developing' : 'Needs attention';
      const color = value >= 70 ? '#80e0c1' : value >= 50 ? '#ffc879' : '#ff9eac';
      return { key, name: prettyTopic(key), value, state, color, icon: TOPIC_ICON[key] || prettyTopic(key).slice(0, 2) };
    })
    .sort((a, b) => b.value - a.value);
}

/* ---------- derived stats (from the latest 50 events the API returns) ---------- */
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function computeStreak(history = []) {
  const days = new Set(history.map((h) => dayKey(new Date(h.timestamp))));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // today not yet active: streak can still be alive
  let n = 0;
  while (days.has(dayKey(d))) { n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

export function buildStats(progress) {
  const totals = progress.totals || {};
  const hist = progress.history || [];
  const scores = hist.map((h) => h.quiz_score).filter((s) => typeof s === 'number');
  const mins = Math.round(totals.minutes_spent || 0);
  const weekAgo = Date.now() - 7 * 864e5;
  const weekSec = hist.filter((h) => new Date(h.timestamp).getTime() >= weekAgo).reduce((a, h) => a + (h.time_spent_seconds || 0), 0);
  return {
    time: `${Math.floor(mins / 60)}h ${mins % 60}m`,
    completed: totals.courses_completed || 0,
    avgQuiz: scores.length ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—',
    streak: computeStreak(hist),
    weekHours: (weekSec / 3600).toFixed(1),
  };
}

// Backend usernames: 3-50 chars of letters, digits, _ . -  (email is the unique login handle).
export function makeUsername(fullName, email) {
  const clean = (s) => s.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_.-]/g, '');
  let u = clean(fullName);
  if (u.length < 3) u = clean(email.split('@')[0]);
  if (u.length < 3) u = 'learner';
  return `${u.slice(0, 40)}_${Math.floor(1000 + Math.random() * 9000)}`; // suffix avoids username collisions
}
