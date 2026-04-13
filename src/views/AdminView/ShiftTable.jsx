import React from 'react';
import { MessageSquare } from 'lucide-react';
import { SHIFT_TYPES, RULES } from '../../utils/constants';

const ShiftTable = ({ daysArray, staff, memos, shifts, requests, activeShift, handleCellClick, setIsMemoModalOpen }) => {
  return (
    <div className="flex-1 glass-card overflow-auto relative rounded-2xl">
      <table className="w-full border-collapse">
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
        <tbody>
          {staff.map((s, sIdx) => (
            <tr key={sIdx} className="hover:bg-white/5 transition-colors border-b border-white/5">
              <td className="sticky left-0 z-10 p-4 text-sm font-medium bg-slate-900/80 backdrop-blur-md border-r border-white/5">
                <div className="flex items-center gap-2 group">
                  <div className="flex flex-col">
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{s.id}</span>
                  </div>
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
              {daysArray.map((day, dIdx) => {
                const shiftId = (shifts?.[s.id] && shifts?.[s.id][dIdx]) || SHIFT_TYPES.OFF.id;
                const shiftKey = Object.keys(SHIFT_TYPES).find(k => SHIFT_TYPES[k].id === shiftId);
                const shift = shiftKey ? SHIFT_TYPES[shiftKey] : SHIFT_TYPES.OFF;
                const isRequestedHoliday = requests?.[s.id]?.includes(dIdx);
                const isOff = shiftId === SHIFT_TYPES.OFF.id;

                return (
                  <td
                    key={dIdx}
                    onClick={() => handleCellClick(s.id, dIdx)}
                    className={`p-1 cursor-pointer transition-all relative border border-transparent ${isRequestedHoliday ? 'bg-red-500/10' : ''}`}
                  >
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
                    {isRequestedHoliday && (
                      <div className="absolute -top-0.5 -right-0.5 z-10 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 shadow-lg animate-pulse" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-20">
          <tr className="glass border-t border-white/10">
            <td className="sticky left-0 p-4 text-xs font-bold uppercase bg-slate-800">出勤人数</td>
            {daysArray.map((_, dIdx) => {
              let dailyCount = 0;
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
