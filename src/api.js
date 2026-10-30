// LearnMate API client. Talks to the Flask backend and adapts its responses to the
// shapes the UI components already render.
//
// Backend URL: set VITE_API_URL in frontend/.env (default http://localhost:5000/api).
// The backend's CORS_ORIGINS must include the origin Vite serves from (default http://localhost:5173).

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
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
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
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
export const getProgress = () => request('/progress?per_page=50'); // backend caps per_page at 50

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
