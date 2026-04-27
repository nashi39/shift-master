import { RULES, SHIFT_TYPES } from './constants';

/**
 * シフトの自動割り当てロジック（下書き生成）
 * 
 * 1. スタッフ全員を一度「休日」で初期化します。
 * 2. 1日から順に、その日に働けるスタッフを探して割り当てます。
 * 3. 「休み希望が出ているか」「連勤制限を超えていないか」をチェックします。
 * 4. 勤務日数が少ないスタッフを優先的に割り当てることで、公平性を保ちます。
 * 
 * @param {Array} staffIds - スタッフIDの配列
 * @param {Object} availabilityRequests - スタッフからの休み希望 { スタッフID: [休みの日(0-30), ...] }
 * @param {number} daysInMonth - 月の日数
 * @returns {Object} - 生成されたシフト表 { スタッフID: [シフトID, ...] }
 */
export const generateDraftShift = (staffIds, availabilityRequests, daysInMonth) => {
  const table = {};
  // 全員を「休日」で初期化
  staffIds.forEach(id => {
    table[id] = new Array(daysInMonth).fill(SHIFT_TYPES.OFF.id);
  });

  const staffWorkCount = {}; // スタッフごとの現在の連勤数をカウント
  staffIds.forEach(id => staffWorkCount[id] = 0);

  for (let day = 0; day < daysInMonth; day++) {
    let assignedToday = 0;
    
    // その日に働けるスタッフを抽出
    const availableStaff = (staffIds || []).filter(id => {
      const isHolidayRequested = availabilityRequests?.[id]?.includes(day);
      const isUnderMaxDays = (staffWorkCount?.[id] || 0) < RULES.MAX_CONSECUTIVE_DAYS;
      // 「休み希望がない」かつ「連勤制限以内」のスタッフのみ
      return !isHolidayRequested && isUnderMaxDays;
    }).sort((a, b) => (staffWorkCount?.[a] || 0) - (staffWorkCount?.[b] || 0)); // 勤務が少ない順に並び替え（公平性）

    // 規定の人数（MIN_STAFF_PER_DAY）に達するまでシフトを割り当てる
    for (const staffId of availableStaff) {
      if (assignedToday >= RULES.MIN_STAFF_PER_DAY) break;

      // シフトの種類（早番・日勤など）を順番に割り当てる
      const shiftTypes = [SHIFT_TYPES.DAY.id, SHIFT_TYPES.EARLY.id, SHIFT_TYPES.NIGHT.id, SHIFT_TYPES.DAY_AM.id];
      table[staffId][day] = shiftTypes[day % shiftTypes.length];
      
      staffWorkCount[staffId]++; // 連勤カウントを増やす
      assignedToday++;
    }

    // 今日が休みになったスタッフの連勤カウントをリセット
    staffIds.forEach(id => {
      if (table[id][day] === SHIFT_TYPES.OFF.id) {
        staffWorkCount[id] = 0;
      }
    });
  }

  return table;
};

/**
 * シフトのルール違反をチェックして警告を返す
 * 
 * 1. 各日の出勤人数が足りているかチェック。
 * 2. スタッフが連勤制限（例：5連勤まで）を超えていないかチェック。
 * 
 * @param {Object} table - チェック対象のシフト表
 * @param {number} daysInMonth - 月の日数
 * @returns {Array} - アラートのリスト [{ day, type, message, staffId }]
 */
export const checkShiftRules = (table, daysInMonth) => {
  const alerts = [];
  const staffIds = Object.keys(table);

  for (let day = 0; day < daysInMonth; day++) {
    let count = 0;
    staffIds.forEach(id => {
      // 休日以外のシフトが入っている人数を数える
      if (table?.[id]?.[day] && table[id][day] !== SHIFT_TYPES.OFF.id) count++;
    });

    // 人数不足チェック
    if (count < RULES.MIN_STAFF_PER_DAY) {
      alerts.push({
        day,
        type: 'error',
        message: `スタッフ数が不足しています (${count}/${RULES.MIN_STAFF_PER_DAY})`,
      });
    }
  }

  // 連勤チェック
  staffIds.forEach(id => {
    let consecutive = 0;
    for (let day = 0; day < daysInMonth; day++) {
      if (table?.[id]?.[day] && table[id][day] !== SHIFT_TYPES.OFF.id) {
        consecutive++;
        // 規定の連勤数を超えたら警告
        if (consecutive > RULES.MAX_CONSECUTIVE_DAYS) {
          alerts.push({
            day,
            staffId: id,
            type: 'warning',
            message: `${id} さんが ${consecutive} 日連続勤務になっています`,
          });
        }
      } else {
        // 休みが入ったらカウントリセット
        consecutive = 0;
      }
    }
  });

  return alerts;
};
