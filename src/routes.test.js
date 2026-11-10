import assert from 'node:assert/strict';
import test from 'node:test';
import { pageForPath, pathForPage } from './routes.js';

test('maps existing display pages to stable browser paths', () => {
  assert.equal(pathForPage('Student Dashboard'), '/dashboard');
  assert.equal(pathForPage('Explore Courses'), '/explore');
  assert.equal(pathForPage('Focus Mode'), '/focus');
  assert.equal(pathForPage('Guardian Dashboard'), '/guardian');
  assert.equal(pathForPage('Unknown page'), '/dashboard');
});

test('maps paths back to existing display pages and safely falls back', () => {
  assert.equal(pageForPath('/profile/'), 'Profile');
  assert.equal(pageForPath('/recommendations'), 'Recommendations');
  assert.equal(pageForPath('/focus'), 'Focus Mode');
  assert.equal(pageForPath('/guardian'), 'Guardian Dashboard');
  assert.equal(pageForPath('/missing', 'Landing Page'), 'Landing Page');
});
