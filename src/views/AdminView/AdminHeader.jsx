import React from 'react';
import { Printer, Wand2, LogOut } from 'lucide-react';

const AdminHeader = ({ selectedMonth, handleMagicFill, logout }) => {
  return (
    <header className="flex justify-between items-center glass-card p-4 px-8">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Shift Master <span className="text-sm font-normal text-slate-400 ml-2">管理者ダッシュボード</span>
        </h1>
        <p className="text-sm text-slate-400">{selectedMonth.getFullYear()}年 {selectedMonth.getMonth() + 1}月</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => window.print()} className="glass p-2 px-4 rounded-lg flex items-center gap-2 hover:bg-white/10 transition">
          <Printer size={18} /> 印刷用
        </button>
        <button onClick={handleMagicFill} className="bg-blue-600 p-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">
          <Wand2 size={18} /> 自動生成
        </button>
        <button onClick={logout} className="glass p-2 px-4 rounded-lg flex items-center gap-2 hover:bg-red-500/20 text-red-400 transition">
          <LogOut size={18} /> ログアウト
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
