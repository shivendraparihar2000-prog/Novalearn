import assert from 'node:assert/strict';
import test from 'node:test';

const CATEGORY_RULES = {
  class_1_8: { study_interval_minutes: 30, break_duration_minutes: 5 },
  class_9_10: { study_interval_minutes: 45, break_duration_minutes: 3 },
  class_11_12: { study_interval_minutes: 45, break_duration_minutes: 5 },
  university: { study_interval_minutes: 60, break_duration_minutes: 10 },
  independent: { study_interval_minutes: 60, break_duration_minutes: 10 },
};

function getCategoryDefaults(category) {
  return CATEGORY_RULES[category] || { study_interval_minutes: 60, break_duration_minutes: 10 };
}

function calculateSessionDisplay(studySeconds = 0, breakSeconds = 0) {
  const sMins = Math.floor(studySeconds / 60);
  const sSecs = Math.floor(studySeconds % 60);
  const bMins = Math.floor(breakSeconds / 60);
  const bSecs = Math.floor(breakSeconds % 60);
  return {
    studyFormatted: `${String(sMins).padStart(2, '0')}:${String(sSecs).padStart(2, '0')}`,
    breakFormatted: `${String(bMins).padStart(2, '0')}:${String(bSecs).padStart(2, '0')}`,
  };
}

test('Focus mode category rules return correct defaults', () => {
  assert.deepEqual(getCategoryDefaults('class_1_8'), { study_interval_minutes: 30, break_duration_minutes: 5 });
  assert.deepEqual(getCategoryDefaults('class_9_10'), { study_interval_minutes: 45, break_duration_minutes: 3 });
  assert.deepEqual(getCategoryDefaults('class_11_12'), { study_interval_minutes: 45, break_duration_minutes: 5 });
  assert.deepEqual(getCategoryDefaults('university'), { study_interval_minutes: 60, break_duration_minutes: 10 });
  assert.deepEqual(getCategoryDefaults('independent'), { study_interval_minutes: 60, break_duration_minutes: 10 });
  assert.deepEqual(getCategoryDefaults(null), { study_interval_minutes: 60, break_duration_minutes: 10 });
});

test('calculateSessionDisplay formats study and break time without overlap', () => {
  const display = calculateSessionDisplay(1805, 305);
  assert.equal(display.studyFormatted, '30:05');
  assert.equal(display.breakFormatted, '05:05');
});
