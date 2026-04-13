import React from 'react';
import { MessageSquare, X } from 'lucide-react';

const MessageListModal = ({ isOpen, onClose, staff, memos }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden border-white/10">
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <MessageSquare className="text-emerald-400" /> スタッフからのメッセージ
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {staff.map((s) => (
            <div key={s.id} className={`p-4 rounded-2xl border transition-all ${memos?.[s.id] ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-200">{s.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{s.id}</span>
                </div>
                {memos?.[s.id] && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase">Message</span>}
              </div>
              <div className="text-sm text-slate-300 leading-relaxed font-medium">
                {memos?.[s.id] || <span className="text-slate-600 italic text-xs">特になし</span>}
              </div>
            </div>
          ))}
          {staff.length === 0 && (
            <div className="text-center py-10 text-slate-500 italic">スタッフが登録されていません</div>
          )}
        </div>

        <footer className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
          <button onClick={onClose} className="px-8 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition">
            閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MessageListModal;
