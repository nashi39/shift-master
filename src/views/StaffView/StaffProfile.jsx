import React from 'react';
import { User } from 'lucide-react';

/**
 * StaffProfile
 * 
 * 【役割】
 * ログインしているスタッフの情報を表示するプロフィールカードです。
 * 
 * @param {Object} props
 * @param {Object} props.userData - ユーザー情報のオブジェクト
 */
const StaffProfile = ({ userData }) => {
  if (!userData) return null;
  
  return (
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
  );
};

export default StaffProfile;
