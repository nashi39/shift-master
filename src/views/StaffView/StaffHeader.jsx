import React from 'react';
import { LogOut } from 'lucide-react';

/**
 * StaffHeader
 * 
 * 【役割】
 * スタッフ画面の最上部に表示されるヘッダーです。
 * 
 * @param {Object} props
 * @param {number} props.year - 現在の年
 * @param {number} props.month - 現在の月（0-11）
 * @param {Function} props.logout - ログアウト処理を実行する関数
 */
const StaffHeader = ({ year, month, logout }) => {
  return (
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
  );
};

export default StaffHeader;
