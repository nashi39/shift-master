import React from 'react';

/**
 * StaffLoading
 * 
 * 【役割】
 * データの読み込み中に表示されるローディング画面です。
 */
const StaffLoading = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-slate-800 animate-spin" />
      <p className="text-slate-400 font-medium">読み込み中...</p>
    </div>
  </div>
);

export default StaffLoading;
