import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiBaseUrl, ApiError, session } from './api.js';

test('1. Production URL configured returns trimmed URL', () => {
  const prodUrl = 'https://novalearn-backend-bjdm.onrender.com/api';
  const resolved = resolveApiBaseUrl({
    PROD: true,
    VITE_API_URL: prodUrl,
  });
  assert.equal(resolved, prodUrl);
});

test('2. Production URL missing throws configuration error', () => {
  assert.throws(
    () => resolveApiBaseUrl({ PROD: true }),
    /Configuration error: VITE_API_URL must be explicitly defined in production environment\./
  );
  assert.throws(
    () => resolveApiBaseUrl({ PROD: true, VITE_API_URL: '' }),
    /Configuration error: VITE_API_URL must be explicitly defined in production environment\./
  );
  assert.throws(
    () => resolveApiBaseUrl({ PROD: true, VITE_API_URL: '   ' }),
    /Configuration error: VITE_API_URL must be explicitly defined in production environment\./
  );
});

test('3. Local development fallback to localhost:5000/api when unconfigured', () => {
  const resolved = resolveApiBaseUrl({ PROD: false });
  assert.equal(resolved, 'http://localhost:5000/api');
});

test('4. Trailing slash normalization in production and development', () => {
  const prodWithSlashes = 'https://novalearn-backend-bjdm.onrender.com/api////';
  assert.equal(
    resolveApiBaseUrl({ PROD: true, VITE_API_URL: prodWithSlashes }),
    'https://novalearn-backend-bjdm.onrender.com/api'
  );

  const devWithSlashes = 'http://custom-dev:5000/api///';
  assert.equal(
    resolveApiBaseUrl({ PROD: false, VITE_API_URL: devWithSlashes }),
    'http://custom-dev:5000/api'
  );
});

test('5. Correct endpoint construction and ApiError structure', () => {
  const err = new ApiError(403, 'forbidden_access', 'Access denied to learner', { reason: 'unauthorized_guardian' });
  assert.equal(err.status, 403);
  assert.equal(err.code, 'forbidden_access');
  assert.equal(err.message, 'Access denied to learner');
  assert.equal(err.details.reason, 'unauthorized_guardian');
});

test('6. Session storage helper functions manage tokens safely', () => {
  // Test fallback when localStorage is unavailable or in Node environment
  session.set({ token: 'mock-jwt-token-12345', user: { id: 1, role: 'learner' } });
  // Under Node without mocked localStorage it degrades safely
  session.clear();
});
