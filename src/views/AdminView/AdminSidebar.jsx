import React from 'react';
import { MessageSquare, Users, AlertTriangle } from 'lucide-react';
import { SHIFT_TYPES } from '../../utils/constants';

/**
 * 管理者画面のサイドバーコンポーネント
 * 
 * @param {string} activeShift - 現在選択されている（入力モードの）シフトID
 * @param {Function} setActiveShift - 入力モードのシフトを切り替える関数
 * @param {Function} openStaffModal - スタッフ管理モーダルを開く関数
 * @param {Function} setIsMemoModalOpen - メッセージ一覧モーダルの開閉を制御する関数
 * @param {Array} alerts - 現在のシフト表における警告・違反情報の配列
 */
const AdminSidebar = ({ activeShift, setActiveShift, openStaffModal, setIsMemoModalOpen, alerts }) => {
  return (
    <aside 
      className="glass-card p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar"
      style={{ width: '320px', minWidth: '320px', flexShrink: 0 }}
    >
      {/* シフトタイプ選択：クリックして入力するシフトの種類を選びます */}
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

      {/* スタッフ設定：スタッフの名前やログインID、招待キーを管理するモーダルを起動 */}
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

      {/* コミュニケーション：スタッフからのメモ（連絡事項）を一括確認 */}
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

      {/* 警告・アラート：最低人数不足や連勤制限違反などを自動チェックして表示 */}
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
