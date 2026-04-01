import React, { useState, useEffect } from 'react';
import { useShifts } from '../context/ShiftContext';
import { useAuth } from '../context/AuthContext';
import { Check, Calendar as CalendarIcon, User, Save, LogOut } from 'lucide-react';

const StaffView = () => {
  const { requests, updateGlobalShifts, loading: shiftsLoading } = useShifts();
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
    if (userData && requests[userData.staffId]) {
      setLocalRequests(requests[userData.staffId]);
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
    const newRequests = { ...requests, [userData.staffId]: localRequests };
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
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            SHIFT MASTER
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Staff Portal • {year}年 {month + 1}月
          </p>
        </div>
        <button 
          onClick={logout}
          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all border border-white/5"
        >
          <LogOut size={18} />
        </button>
      </header>

      <div className="animate-in fade-in duration-700 space-y-6 max-w-lg mx-auto">
        {/* Active Profile Card */}
        <div className="glass-card overflow-hidden bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20 transform rotate-3">
              {userData.name[0]}
            </div>
            <div>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-0.5">Welcome back</p>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {userData.name}
                <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded">ID: {userData.staffId}</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Real Calendar Grid */}
        <div className="glass-card p-5 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8 px-1">
            <h3 className="text-lg font-black flex items-center gap-3 italic">
              <CalendarIcon size={20} className="text-emerald-400" />
              CALENDAR
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
               <span className="text-[10px] text-slate-400 font-bold">休み希望</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
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

              return (
                <button
                  key={day}
                  onClick={() => toggleHoliday(idx)}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-90 overflow-hidden border ${
                    isSelected 
                      ? 'bg-red-500 text-white shadow-xl shadow-red-500/40 border-red-400' 
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`text-sm font-black ${
                    !isSelected && isSunday ? 'text-red-400' : !isSelected && isSaturday ? 'text-blue-400' : ''
                  }`}>
                    {day}
                  </span>
                  {isSelected && <Check size={10} className="mt-1 opacity-80" />}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold text-slate-500 px-2 py-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-500 rounded-lg shadow-sm shadow-red-500/50" />
              <span>お休みしたい日</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-white/10 border border-white/10 rounded-lg" />
              <span>出勤できる日</span>
            </div>
          </div>
        </div>

        {/* Action Button - Sticky at bottom */}
        <div className="fixed bottom-8 left-4 right-4 max-w-lg mx-auto z-50">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 font-black tracking-widest transition-all duration-500 shadow-2xl transform ${
              saved 
                ? 'bg-emerald-500 text-white translate-y-[-4px] scale-[1.02]' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white hover:scale-[1.03] hover:shadow-blue-500/40 active:scale-95'
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
          
          <div className="mt-4 text-center">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse">
              Please save before leaving the portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffView;
