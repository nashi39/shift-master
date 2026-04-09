import React, { useState, useEffect } from 'react';
import { useShifts } from '../context/ShiftContext';
import { useAuth } from '../context/AuthContext';
import { SHIFT_TYPES } from '../utils/constants';
import { Check, Calendar as CalendarIcon, User, Save, LogOut, Info } from 'lucide-react';

const StaffView = () => {
  const { shifts, requests, updateGlobalShifts, loading: shiftsLoading } = useShifts();
  const { userData, logout } = useAuth();
  const [localRequests, setLocalRequests] = useState([]);
  const [saved, setSaved] = useState(false);

  // Calendar calculations
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Initialize local requests when data is loaded
  useEffect(() => {
    if (userData && requests[userData.id]) {
      setLocalRequests(requests[userData.id]);
    }
  }, [userData, requests]);

  const toggleHoliday = (dayIdx) => {
    if (localRequests.includes(dayIdx)) {
      setLocalRequests(localRequests.filter(d => d !== dayIdx));
    } else {
      setLocalRequests([...localRequests, dayIdx]);
    }
    setSaved(false);
  };

  const handleSave = async () => {
    if (!userData) return;
    const newRequests = { ...requests, [userData.id]: localRequests };
    await updateGlobalShifts(null, newRequests);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (shiftsLoading || !userData) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-slate-800 animate-spin" />
        <p className="text-slate-400 font-medium">読み込み中...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-32 font-sans">
      {/* Header Area */}
      <header className="mb-6 px-2 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 leading-none">
            SHIFT MASTER
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            STAFF PORTAL • {year}年 {month + 1}月
          </p>
        </div>
        <button 
          onClick={logout}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5 shadow-inner"
        >
          <LogOut size={18} />
        </button>
      </header>

      <div className="animate-in fade-in duration-700 space-y-6 max-w-lg mx-auto">
        {/* Active Profile Card */}
        <div className="glass-card overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <User size={80} />
          </div>
          <div className="p-5 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30 transform rotate-3 ring-4 ring-white/10">
              {userData.name[0]}
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Authenticated Staff</p>
              <h2 className="text-2xl font-black">{userData.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase">ID: {userData.id}</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase border border-emerald-500/20 tracking-tighter">ActiveNow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Calendar Grid */}
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
            {/* Day Headers */}
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
            
            {/* Padding Days for start of month */}
            {paddingDays.map(i => (
              <div key={`pad-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}
            
            {/* Actual Days */}
            {daysArray.map((day, idx) => {
              const isSelected = localRequests.includes(idx);
              const dayOfWeek = (firstDayOfMonth + idx) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              
              // Find assigned shift
              const assignedShiftId = (shifts[userData.id] && shifts[userData.id][idx]) || SHIFT_TYPES.OFF.id;
              const shift = Object.values(SHIFT_TYPES).find(s => s.id === assignedShiftId);
              const hasShift = assignedShiftId !== SHIFT_TYPES.OFF.id;

              return (
                <button
                  key={day}
                  onClick={() => toggleHoliday(idx)}
                  className={`calendar-day relative aspect-square rounded-[1.2rem] flex flex-col items-center justify-between p-1.5 transition-all duration-300 active:scale-90 overflow-hidden border-2 cursor-pointer z-10 ${
                    isSelected 
                      ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/30' 
                      : hasShift
                        ? 'bg-white/5 border-white/20 shadow-xl'
                        : 'border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="w-full flex justify-between items-start">
                    <span className={`text-[10px] font-black ml-0.5 ${
                      isSelected ? 'text-white' : !isSelected && isSunday ? 'text-red-400' : !isSelected && isSaturday ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {day}
                    </span>
                  </div>
                  
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
                  
                  {!hasShift && (
                    <div className="h-2" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legend Section */}
          <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[SHIFT_TYPES.EARLY, SHIFT_TYPES.DAY, SHIFT_TYPES.NIGHT, SHIFT_TYPES.DAY_AM].map(type => (
              <div key={type.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-md" style={{ backgroundColor: type.color }}>
                  {type.short}
                </div>
                <span className="text-[10px] font-bold text-slate-400">{type.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-red-500/5 p-2 rounded-xl border border-red-500/20">
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-red-500 text-white shadow-md">
                <Check size={12} strokeWidth={4} />
              </div>
              <span className="text-[10px] font-bold text-red-400">休み希望</span>
            </div>
          </div>
        </div>

        {/* Action Button - Sticky at bottom */}
        <div className="fixed bottom-8 left-4 right-4 max-w-lg mx-auto z-50">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 font-black tracking-widest transition-all duration-500 shadow-2xl transform ${
              saved 
                ? 'bg-emerald-500 text-white translate-y-[-4px] scale-[1.02]' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white hover:scale-[1.05] hover:shadow-blue-500/40 active:scale-95'
            }`}
          >
            {saved ? (
              <>
                <div className="bg-white/20 p-1 rounded-full"><Check size={18} /></div>
                希望を送信しました
              </>
            ) : (
              <>
                <Save size={20} className="opacity-80" />
                希望を確定して送信
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffView;
