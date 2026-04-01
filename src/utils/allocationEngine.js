import { RULES, SHIFT_TYPES } from './constants';

/**
 * Basic auto-allocation logic
 * @param {Object} staffList - List of staff members
 * @param {Object} availabilityRequests - Record of holidays requested by staff { [staffId]: [dayIndex, ...] }
 * @param {number} daysInMonth - Number of days to generate for
 * @returns {Object} - Generated shift table { [staffId]: [shiftId, ...] }
 */
export const generateDraftShift = (staffIds, availabilityRequests, daysInMonth) => {
  const table = {};
  staffIds.forEach(id => {
    table[id] = new Array(daysInMonth).fill(SHIFT_TYPES.OFF.id);
  });

  const staffWorkCount = {}; // Track consecutive days { [staffId]: count }
  staffIds.forEach(id => staffWorkCount[id] = 0);

  for (let day = 0; day < daysInMonth; day++) {
    let assignedToday = 0;
    
    // Sort staff by work count to balance (simple heuristic)
    const availableStaff = staffIds.filter(id => {
      const isHolidayRequested = availabilityRequests[id]?.includes(day);
      const isUnderMaxDays = staffWorkCount[id] < RULES.MAX_CONSECUTIVE_DAYS;
      return !isHolidayRequested && isUnderMaxDays;
    }).sort((a, b) => staffWorkCount[a] - staffWorkCount[b]);

    // Try to assign at least MIN_STAFF_PER_DAY
    for (const staffId of availableStaff) {
      if (assignedToday >= RULES.MIN_STAFF_PER_DAY) break;

      // Deterministic shift type for draft (can be randomized or based on patterns)
      // For now: Cycle through Day, Early, Night, Day-AM
      const shiftTypes = [SHIFT_TYPES.DAY.id, SHIFT_TYPES.EARLY.id, SHIFT_TYPES.NIGHT.id, SHIFT_TYPES.DAY_AM.id];
      table[staffId][day] = shiftTypes[day % shiftTypes.length];
      
      staffWorkCount[staffId]++;
      assignedToday++;
    }

    // Reset work count for those who are NOT working today
    staffIds.forEach(id => {
      if (table[id][day] === SHIFT_TYPES.OFF.id) {
        staffWorkCount[id] = 0;
      }
    });
  }

  return table;
};

/**
 * Check for rule violations and return alerts
 * @param {Object} table 
 * @returns {Array} - List of alerts { day, type, message, staffId? }
 */
export const checkShiftRules = (table, daysInMonth) => {
  const alerts = [];
  const staffIds = Object.keys(table);

  for (let day = 0; day < daysInMonth; day++) {
    let count = 0;
    staffIds.forEach(id => {
      if (table[id][day] !== SHIFT_TYPES.OFF.id) count++;
    });

    if (count < RULES.MIN_STAFF_PER_DAY) {
      alerts.push({
        day,
        type: 'error',
        message: `スタッフ数が不足しています (${count}/${RULES.MIN_STAFF_PER_DAY})`,
      });
    }
  }

  // Consecutive days check
  staffIds.forEach(id => {
    let consecutive = 0;
    for (let day = 0; day < daysInMonth; day++) {
      if (table[id][day] !== SHIFT_TYPES.OFF.id) {
        consecutive++;
        if (consecutive > RULES.MAX_CONSECUTIVE_DAYS) {
          alerts.push({
            day,
            staffId: id,
            type: 'warning',
            message: `${id} さんが ${consecutive} 日連続勤務になっています`,
          });
        }
      } else {
        consecutive = 0;
      }
    }
  });

  return alerts;
};
