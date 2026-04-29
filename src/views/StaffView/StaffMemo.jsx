import React from 'react';
import { MessageSquare } from 'lucide-react';

/**
 * StaffMemo
 * 
 * 【役割】
 * スタッフが管理者へ連絡事項や理由を伝えるための入力エリアです。
 * 
 * @param {Object} props
 * @param {string} props.localMemo - メモの内容
 * @param {Function} props.setLocalMemo - メモの内容を更新する関数
 * @param {Function} props.setSaved - 保存済みステータスをリセットするための関数
 */
const StaffMemo = ({ localMemo, setLocalMemo, setSaved }) => {
  return (
    <div className="glass-card p-5 border border-white/10 shadow-2xl space-y-4">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
        <MessageSquare size={14} className="text-blue-400" />
        連絡事項・理由
      </label>
      <textarea
        value={localMemo}
        onChange={(e) => {
          setLocalMemo(e.target.value);
          setSaved(false);
        }}
        placeholder="例: 法事のため / 旅行のため等（任意）"
        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all min-h-[120px] resize-none placeholder:text-slate-600"
      />
    </div>
  );
};

export default StaffMemo;
