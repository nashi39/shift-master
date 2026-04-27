// シフトの種類と、画面表示用の設定（名前、色など）
export const SHIFT_TYPES = {
  EARLY: { id: 'early', label: '早番', color: 'var(--accent-warning)', short: '早' },
  NIGHT: { id: 'night', label: '夜勤', color: 'var(--accent-secondary)', short: '夜' },
  DAY: { id: 'day', label: '日勤', color: 'var(--accent-primary)', short: '日' },
  DAY_AM: { id: 'day_am', label: '日勤(AM)', color: 'var(--accent-success)', short: 'AM' },
  OFF: { id: 'off', label: '休日', color: 'transparent', short: '休' },
};

// シフト作成のルール設定
export const RULES = {
  MIN_STAFF_PER_DAY: 20,    // 1日あたりの最低必要人数
  MAX_CONSECUTIVE_DAYS: 5, // 最大連勤数
  TOTAL_STAFF: 30,         // 全スタッフ数
};

export const COLLECTION_NAMES = {
  SHIFTS: 'shifts',
  STAFF: 'staff',
  REQUESTS: 'requests',
};
