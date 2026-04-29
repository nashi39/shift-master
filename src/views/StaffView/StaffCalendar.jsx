import React from 'react';
import { Calendar as CalendarIcon, Info, Check } from 'lucide-react';
import { SHIFT_TYPES } from '../../utils/constants';

/**
 * StaffCalendar
 * 
 * 【役割】
 * シフト確認および休み希望を入力するためのカレンダーです。
 * 
 * @param {Object} props
 * @param {number[]} props.daysArray - 月の日付配列
 * @param {number[]} props.paddingDays - 月の開始位置を合わせるためのパディング配列
 * @param {number} props.firstDayOfMonth - 月の最初の日の曜日インデックス
 * @param {number[]} props.localRequests - 現在の休み希望日のインデックス配列
 * @param {Function} props.toggleHoliday - 休み希望を切り替える関数
 * @param {Object} props.shifts - 全体のシフトデータ
 * @param {Object} props.userData - ログインユーザーの情報
 */
const StaffCalendar = ({ 
  daysArray, 
  paddingDays, 
  firstDayOfMonth, 
  localRequests, 
  toggleHoliday, 
  shifts, 
  userData 
}) => {
  return (
    <div className="glass-card p-5 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-md font-black flex items-center gap-3 italic tracking-tight">
          <CalendarIcon size={20} className="text-blue-400" />
          MONTHLY SHIFT
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <Info size={12} />
          日付をタップで休み希望
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2.5">
        {/* 曜日ヘッダー (日〜土) */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
          <div 
            key={d} 
            className={`text-center text-[9px] font-black py-2 mb-2 tracking-tighter ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
        
        {/* 月の開始日までの空セルを埋める */}
        {paddingDays.map(i => (
          <div key={`pad-${i}`} className="aspect-square opacity-0 pointer-events-none" />
        ))}
        
        {/* 各日付のレンダリング */}
        {daysArray.map((day, idx) => {
          const isSelected = localRequests.includes(idx); // 休み希望として選択されているか
          const dayOfWeek = (firstDayOfMonth + idx) % 7;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;
          
          // 該当する日に割り当てられたシフト情報を取得
          const assignedShiftId = (shifts?.[userData?.id] && shifts?.[userData?.id][idx]) || SHIFT_TYPES.OFF.id;
          const shift = Object.values(SHIFT_TYPES).find(s => s.id === assignedShiftId) || SHIFT_TYPES.OFF;
          const hasShift = assignedShiftId !== SHIFT_TYPES.OFF.id;

          return (
            <button
              key={day}
              onClick={() => toggleHoliday(idx)}
              className={`calendar-day relative aspect-square rounded-[1.2rem] flex flex-col items-center justify-between p-1.5 transition-all duration-300 active:scale-90 overflow-hidden border-2 cursor-pointer z-10 ${
                isSelected 
                  ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/30' // 休み希望選択時
                  : hasShift
                    ? 'bg-white/5 border-white/20 shadow-xl' // シフトあり
                    : 'border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10' // シフトなし
              }`}
            >
              <div className="w-full flex justify-between items-start">
                <span className={`text-[10px] font-black ml-0.5 ${
                  isSelected ? 'text-white' : !isSelected && isSunday ? 'text-red-400' : !isSelected && isSaturday ? 'text-blue-400' : 'text-slate-400'
                }`}>
                  {day}
                </span>
              </div>
              
              {/* 確定済みシフトがある場合のバッジ表示 */}
              {hasShift && (
                <div 
                  className={`w-full py-1 rounded-lg text-[10px] font-black text-white shadow-lg animate-in zoom-in duration-300 mb-0.5 ${
                    isSelected ? 'ring-2 ring-white/30' : ''
                  }`}
                  style={{ backgroundColor: shift.color }}
                >
                  {shift.short}
                </div>
              )}
              
              {!hasShift && <div className="h-2" />}
            </button>
          );
        })}
      </div>
      
      {/* 凡例（レジェンド）: シフトの種類や休み希望の説明 */}
      <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* シフトタイプ別の凡例 */}
        {[SHIFT_TYPES.EARLY, SHIFT_TYPES.DAY, SHIFT_TYPES.NIGHT, SHIFT_TYPES.DAY_AM].map(type => (
          <div key={type.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-md" style={{ backgroundColor: type.color }}>
              {type.short}
            </div>
            <span className="text-[10px] font-bold text-slate-400">{type.label}</span>
          </div>
        ))}
        {/* 休み希望の凡例 */}
        <div className="flex items-center gap-2 bg-red-500/5 p-2 rounded-xl border border-red-500/20">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-red-500 text-white shadow-md">
            <Check size={12} strokeWidth={4} />
          </div>
          <span className="text-[10px] font-bold text-red-400">休み希望</span>
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;
