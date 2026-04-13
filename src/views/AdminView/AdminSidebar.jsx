import React from 'react';
import { MessageSquare, Users, AlertTriangle } from 'lucide-react';
import { SHIFT_TYPES } from '../../utils/constants';

const AdminSidebar = ({ activeShift, setActiveShift, openStaffModal, setIsMemoModalOpen, alerts }) => {
  return (
    <aside className="w-64 glass-card p-4 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">シフトタイプ選択</h3>
        <div className="flex flex-col gap-2">
          {Object.values(SHIFT_TYPES).map(type => (
            <button
              key={type.id}
              onClick={() => setActiveShift(type.id)}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${activeShift === type.id
                ? 'border-blue-500 bg-blue-500/20 shadow-inner'
                : 'border-transparent hover:bg-white/5'
                }`}
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">スタッフ設定</h3>
        <button
          onClick={openStaffModal}
          className="w-full p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col items-center gap-2 group hover:bg-blue-500/10 transition-all border-dashed"
        >
          <Users size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">スタッフ名・ID管理</span>
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">コミュニケーション</h3>
        <button
          onClick={() => setIsMemoModalOpen(true)}
          className="w-full p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center gap-2 group hover:bg-emerald-500/10 transition-all border-dashed"
        >
          <MessageSquare size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">メッセージを確認</span>
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">警告・アラート ({alerts.length})</h3>
        <div className="flex flex-col gap-2">
          {alerts.length === 0 ? (
            <p className="text-xs text-emerald-400 bg-emerald-400/10 p-3 rounded-lg">✓ すべての条件を満たしています</p>
          ) : (
            alerts.map((alert, i) => (
              <div key={i} className={`p-3 rounded-lg flex gap-3 text-xs ${alert.type === 'error' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'}`}>
                <AlertTriangle size={14} className="shrink-0" />
                <div>
                  <strong>{alert.day + 1}日:</strong> {alert.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
