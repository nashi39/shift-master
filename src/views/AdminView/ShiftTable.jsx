import React from 'react';
import { MessageSquare } from 'lucide-react';
import { SHIFT_TYPES, RULES } from '../../utils/constants';

/**
 * シフト表のメインテーブルコンポーネント
 * 
 * @param {Array} daysArray - 月の日付（1〜31）の配列
 * @param {Array} staff - スタッフ一覧の配列
 * @param {Object} memos - スタッフからのメモ（連絡事項）
 * @param {Object} shifts - 確定済みのシフトデータ
 * @param {Object} requests - スタッフの休み希望データ
 * @param {string} activeShift - 現在入力モードとして選択されているシフトID
 * @param {Function} handleCellClick - セルをクリックした時の入力処理
 * @param {Function} setIsMemoModalOpen - メッセージ一覧モーダルの表示制御
 */
const ShiftTable = ({ daysArray, staff, memos, shifts, requests, activeShift, handleCellClick, setIsMemoModalOpen }) => {
  return (
    <div className="flex-1 glass-card overflow-auto relative rounded-2xl">
      <table className="w-full border-collapse">
        {/* ヘッダー：スタッフ名と日付ラベル */}
        <thead className="sticky top-0 z-20">
          <tr className="glass bg-slate-800">
            <th className="sticky left-0 z-30 p-4 min-w-[200px] text-left border-b border-white/5 bg-slate-800">スタッフ名</th>
            {daysArray.map((day) => (
              <th
                key={day}
                className="p-3 text-sm font-black border-b border-white/5 min-w-[48px] text-center text-slate-300"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>

        {/* ボディ：スタッフごとのシフトデータ行 */}
        <tbody>
          {staff.map((s, sIdx) => (
            <tr key={sIdx} className="hover:bg-white/5 transition-colors border-b border-white/5">
              {/* 固定列：スタッフ名とID、メッセージアイコン */}
              <td className="sticky left-0 z-10 p-4 text-sm font-medium bg-slate-900/80 backdrop-blur-md border-r border-white/5">
                <div className="flex items-center gap-2 group">
                  <div className="flex flex-col">
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{s.id}</span>
                  </div>
                  {/* メモがある場合は緑色のアイコンを表示（クリックで一覧へ） */}
                  {memos?.[s.id] && (
                    <button 
                      onClick={() => setIsMemoModalOpen(true)}
                      className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                </div>
              </td>

              {/* 日付ごとのセル：シフト状態の表示と入力 */}
              {daysArray.map((day, dIdx) => {
                // その日のシフトIDを取得（未設定なら 'off'）
                const shiftId = (shifts?.[s.id] && shifts?.[s.id][dIdx]) || SHIFT_TYPES.OFF.id;
                // IDからシフト名や色の設定を取得
                const shiftKey = Object.keys(SHIFT_TYPES).find(k => SHIFT_TYPES[k].id === shiftId);
                const shift = shiftKey ? SHIFT_TYPES[shiftKey] : SHIFT_TYPES.OFF;
                // スタッフからの休み希望があるかチェック
                const isRequestedHoliday = requests?.[s.id]?.includes(dIdx);
                const isOff = shiftId === SHIFT_TYPES.OFF.id;

                return (
                  <td
                    key={dIdx}
                    onClick={() => handleCellClick(s.id, dIdx)}
                    className={`p-1 cursor-pointer transition-all relative border border-transparent ${isRequestedHoliday ? 'bg-red-500/10' : ''}`}
                  >
                    {/* シフトラベルの表示（休み希望時は赤く強調） */}
                    <div
                      className={`w-full h-10 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all active:scale-95 shadow-lg ${!isOff
                          ? 'glass border-white/10'
                          : isRequestedHoliday
                            ? 'bg-red-500/80 border-2 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            : 'hover:bg-white/5'
                        }`}
                      style={{
                        backgroundColor: !isOff ? `${shift.color}33` : undefined,
                        color: !isOff ? shift.color : 'transparent',
                        backdropFilter: isRequestedHoliday ? 'none' : undefined
                      }}
                    >
                      {!isOff ? shift.short : ''}
                    </div>
                    {/* 休み希望がある場合の小さなインジケーター */}
                    {isRequestedHoliday && (
                      <div className="absolute -top-0.5 -right-0.5 z-10 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 shadow-lg animate-pulse" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {/* フッター：日付ごとの合計出勤人数を集計 */}
        <tfoot className="sticky bottom-0 z-20">
          <tr className="glass border-t border-white/10">
            <td className="sticky left-0 p-4 text-xs font-bold uppercase bg-slate-800">出勤人数</td>
            {daysArray.map((_, dIdx) => {
              let dailyCount = 0;
              // 全スタッフをループして、休み(off)以外の人数をカウント
              staff.forEach(s => {
                if (shifts?.[s.id] && shifts?.[s.id][dIdx] !== SHIFT_TYPES.OFF.id) dailyCount++;
              });
              return (
                <td key={dIdx} className={`p-4 text-center text-sm font-bold ${dailyCount < RULES.MIN_STAFF_PER_DAY ? 'text-red-400' : 'text-emerald-400'}`}>
                  {dailyCount}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ShiftTable;
