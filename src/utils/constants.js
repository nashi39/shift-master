export const SHIFT_TYPES = {
  EARLY: { id: 'early', label: '早番', color: 'var(--accent-warning)', short: '早' },
  NIGHT: { id: 'night', label: '夜勤', color: 'var(--accent-secondary)', short: '夜' },
  DAY: { id: 'day', label: '日勤', color: 'var(--accent-primary)', short: '日' },
  DAY_AM: { id: 'day_am', label: '日勤(AM)', color: 'var(--accent-success)', short: 'AM' },
  OFF: { id: 'off', label: '休日', color: 'transparent', short: '休' },
};

export const RULES = {
  MIN_STAFF_PER_DAY: 20,
  MAX_CONSECUTIVE_DAYS: 5,
  TOTAL_STAFF: 30,
};

export const COLLECTION_NAMES = {
  SHIFTS: 'shifts',
  STAFF: 'staff',
  REQUESTS: 'requests',
};
