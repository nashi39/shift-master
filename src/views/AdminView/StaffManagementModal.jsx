import React from 'react';
import { Users, X, Trash2, Plus, Wand2, Share2 } from 'lucide-react';

/**
 * スタッフ管理モーダルコンポーネント
 * 
 * @param {boolean} isOpen - モーダルの表示状態
 * @param {Function} onClose - モーダルを閉じる関数
 * @param {Array} tempStaff - 編集中のスタッフ情報（一時的な状態）
 * @param {Function} setTempStaff - 編集中のスタッフ情報を更新する関数
 * @param {Object} regData - Firestoreから取得した各スタッフの登録状況・招待キー
 * @param {boolean} isLocalLoading - メール送信などの非同期処理中の読込状態
 * @param {Function} handleReinvite - 再招待メールの送信処理
 * @param {Function} handleSaveStaff - スタッフ構成の保存処理
 * @param {Function} handleAddStaff - 新規スタッフ行の追加処理
 */
const StaffManagementModal = ({ 
  isOpen, 
  onClose, 
  tempStaff, 
  setTempStaff, 
  regData, 
  isLocalLoading, 
  handleReinvite, 
  handleSaveStaff, 
  handleAddStaff 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border-white/10">
        {/* ヘッダー */}
        <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Users className="text-blue-400" /> スタッフID・招待管理
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </header>

        {/* スタッフ一覧テーブル */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                <th className="pb-3 px-2">名前</th>
                <th className="pb-3 px-2">スタッフID (ログイン用)</th>
                <th className="pb-3 px-2">招待キー / 状態</th>
                <th className="pb-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tempStaff.map((s, index) => {
                // IDの重複チェック（視覚的なフィードバック用）
                const isDuplicate = tempStaff.filter(item => item.id.toLowerCase() === s.id.toLowerCase()).length > 1;
                return (
                  <tr key={index} className="group">
                    {/* 名前入力 */}
                    <td className="py-3 px-2">
                      <input 
                        type="text" 
                        value={s.name} 
                        onChange={(e) => { 
                          const newStaff = [...tempStaff]; 
                          newStaff[index].name = e.target.value; 
                          setTempStaff(newStaff); 
                        }} 
                        placeholder="スタッフ名" 
                        className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm w-full focus:border-blue-500 outline-none" 
                      />
                    </td>
                    {/* ID入力（小文字と英数字のみに自動整形） */}
                    <td className="py-3 px-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={s.id}
                          onChange={(e) => { 
                            const newStaff = [...tempStaff]; 
                            newStaff[index].id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''); 
                            setTempStaff(newStaff); 
                          }}
                          placeholder="user01"
                          className={`bg-white/5 border rounded-lg p-2 text-sm w-full font-mono focus:border-blue-500 outline-none transition-colors ${isDuplicate ? 'border-red-500 bg-red-500/10' : 'border-white/10'}`}
                        />
                        {isDuplicate && (
                          <span className="absolute -bottom-4 left-1 text-[8px] text-red-500 font-bold uppercase">ID重複あり</span>
                        )}
                      </div>
                    </td>
                    {/* 登録状況と招待アクション */}
                    <td className="py-3 px-2">
                      {regData?.[s.id] ? (
                        <div className="flex items-center gap-3">
                          {regData?.[s.id]?.registered ? (
                            // 既に登録済みの場合（再招待/パスワードリセットが可能）
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">登録済み</span>
                              <button
                                onClick={() => handleReinvite(s.id)}
                                disabled={isLocalLoading}
                                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-all flex items-center gap-1 text-[10px] font-bold border border-white/5 rounded-md disabled:opacity-50"
                                title="登録をリセットしてメール送信"
                              >
                                <Wand2 size={12} /> 再招待(リセット)
                              </button>
                            </div>
                          ) : (
                            // 未登録の場合（招待キーの表示とメール送信が可能）
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-mono text-xs">{regData?.[s.id]?.invitationKey}</span>
                                <span className="text-[10px] text-amber-500/60 font-bold">未登録</span>
                              </div>
                              <button
                                onClick={() => handleReinvite(s.id)}
                                disabled={isLocalLoading}
                                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-blue-400 transition-all flex items-center gap-1 text-[10px] font-bold border border-white/5 rounded-md disabled:opacity-50"
                                title="パスワード再設定メールを送信"
                              >
                                <Share2 size={12} /> メール送信
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">保存時にキーを発行します</span>
                      )}
                    </td>
                    {/* 行の削除ボタン */}
                    <td className="py-3 px-2">
                      <button onClick={() => setTempStaff(tempStaff.filter((_, i) => i !== index))} className="p-2 text-slate-500 hover:text-red-400 transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* スタッフ行の新規追加 */}
          <button onClick={handleAddStaff} className="w-full p-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-500 hover:bg-white/5 hover:border-white/30 transition mt-6">
            <Plus size={16} /> 新しいスタッフを追加
          </button>
        </div>

        {/* フッター：保存とキャンセル */}
        <footer className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
          <p className="text-[10px] text-slate-500 max-w-sm">※ IDは一度設定すると変更しないでください。</p>
          <div className="space-x-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition">キャンセル</button>
            <button onClick={handleSaveStaff} className="px-10 py-3 bg-blue-600 rounded-xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all">設定を保存して発行</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StaffManagementModal;
