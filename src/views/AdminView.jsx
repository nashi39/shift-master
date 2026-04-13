import React, { useState } from 'react';
import { useShifts } from '../context/ShiftContext';
import { db, doc, setDoc, getDocs, collection } from '../utils/firebase';
import { SHIFT_TYPES, RULES } from '../utils/constants';
import { generateDraftShift, checkShiftRules } from '../utils/allocationEngine';
import { AlertTriangle, Wand2, Printer, Share2, Users, X, Plus, Trash2, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminView = () => {
  const { 
    shifts = {}, 
    requests = {}, 
    memos = {}, 
    staff = [], 
    updateGlobalShifts, 
    updateStaffConfig, 
    loading 
  } = useShifts();
  const { logout } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeShift, setActiveShift] = useState(SHIFT_TYPES.DAY.id);

  // Staff Management State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [tempStaff, setTempStaff] = useState([]);
  const [regData, setRegData] = useState({});

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const generateKey = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCellClick = (staffId, day) => {
    const currentShift = shifts?.[staffId]?.[day] || SHIFT_TYPES.OFF.id;
    const nextShift = currentShift === activeShift ? SHIFT_TYPES.OFF.id : activeShift;

    const newShifts = { ...(shifts || {}) };
    if (!newShifts[staffId]) newShifts[staffId] = new Array(daysInMonth).fill(SHIFT_TYPES.OFF.id);
    newShifts[staffId][day] = nextShift;

    updateGlobalShifts(newShifts, requests);
  };

  const handleMagicFill = () => {
    const staffIds = staff?.map(s => s.id) || [];
    const draft = generateDraftShift(staffIds, requests || {}, daysInMonth);
    updateGlobalShifts(draft, requests || {});
  };

  const alerts = checkShiftRules(shifts, daysInMonth);

  const openStaffModal = async () => {
    setTempStaff(staff.map(s => ({ ...s })));
    const regSnap = await getDocs(collection(db, "staff_registrations"));
    const regs = {};
    regSnap.forEach(doc => { regs[doc.id] = doc.data(); });
    setRegData(regs);
    setIsStaffModalOpen(true);
  };

  const handleReinvite = async (staffId) => {
    const normalizedId = staffId.toLowerCase();
    const email = `testshift81+${normalizedId}@gmail.com`;

    if (!window.confirm(`${staffId} の登録をリセットして再招待しますか？\n\n送信先: ${email}\n※Firebaseにこのアドレスで登録されている必要があります。`)) return;

    setIsLocalLoading(true);
    try {
      // 1. Trigger password reset email FIRST
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../utils/firebase');

      try {
        await sendPasswordResetEmail(auth, email);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          throw new Error(`送信失敗: ${email} というユーザーが存在しません。Firebaseコンソールのメールアドレスを確認してください。`);
        }
        throw authError;
      }

      // 2. If email sent successfully, reset registration in Firestore
      const newKey = generateKey();
      await setDoc(doc(db, "staff_registrations", normalizedId), {
        name: tempStaff.find(s => s.id === staffId)?.name || "",
        invitationKey: newKey,
        registered: false
      });

      // 3. Delete user profile to revoke current access
      const { query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      const uQuery = query(collection(db, "users"), where("id", "==", normalizedId));
      const uSnap = await getDocs(uQuery);
      for (const uDoc of uSnap.docs) {
        await deleteDoc(doc(db, "users", uDoc.id));
      }

      // Refresh UI data
      const regSnap = await getDocs(collection(db, "staff_registrations"));
      const regs = {};
      regSnap.forEach(doc => { regs[doc.id] = doc.data(); });
      setRegData(regs);

      // Copy invite message to clipboard
      const setupUrl = `${window.location.origin}/setup`;
      const inviteMsg = `【シフト管理システム 再設定のご案内】\n\nパスワード再設定メールを送信しました。\nメール内のリンクからパスワードを更新した後、以下の招待キーを使用して再度セットアップを行ってください。\n\n■招待キー: ${newKey}\n■セットアップURL: ${setupUrl}`;

      try {
        await navigator.clipboard.writeText(inviteMsg);
        alert(`成功: 再設定メールを送信しました。\n\n新しい招待キー(${newKey})を含む案内文をクリップボードにコピーしました。そのままLINEやメールに貼り付けてスタッフへ送れます。`);
      } catch (copyErr) {
        alert(`成功: 再設定メールを送信しました。\n新しい招待キー: ${newKey}\n\n※クリップボードへのコピーに失敗しました。手動でキーを控えて伝えてください。`);
      }
    } catch (err) {
      console.error("Reinvite Error:", err);
      alert(`失敗: ${err.message || err.code}`);
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleSaveStaff = async () => {
    const validStaff = tempStaff.filter(s => s.name.trim() !== "" && s.id.trim() !== "");

    // Check for duplicate IDs
    const lowerIds = validStaff.map(s => s.id.toLowerCase());
    const hasDuplicate = lowerIds.some((id, index) => lowerIds.indexOf(id) !== index);
    if (hasDuplicate) {
      alert("エラー: 画面内で重複しているIDがあります。各スタッフに一意のIDを設定してください。");
      return;
    }

    // Determine which staff were removed
    const currentIds = staff.map(s => s.id.toLowerCase());
    const newIds = validStaff.map(s => s.id.toLowerCase());
    const removedIds = currentIds.filter(id => !newIds.includes(id));

    // Cleanup removed staff data from Firestore
    const { deleteDoc, query, where, getDocs } = await import('firebase/firestore');
    for (const rid of removedIds) {
      await deleteDoc(doc(db, "staff_registrations", rid));
      const uQuery = query(collection(db, "users"), where("id", "==", rid));
      const uSnap = await getDocs(uQuery);
      for (const uDoc of uSnap.docs) {
        await deleteDoc(doc(db, "users", uDoc.id));
      }
    }

    await updateStaffConfig(validStaff);

    for (const s of validStaff) {
      if (!regData?.[s.id]) {
        const newKey = generateKey();
        await setDoc(doc(db, "staff_registrations", s.id.toLowerCase()), {
          name: s.name,
          invitationKey: newKey,
          registered: false
        });
      }
    }
    setIsStaffModalOpen(false);
  };

  const handleAddStaff = () => {
    setTempStaff(prev => {
      // Generate a unique ID that doesn't exist in the LATEST state (prev) or regData
      let nextNum = prev.length + 1;
      let newId = `user${nextNum}`;
      const existingIds = new Set([
        ...prev.map(s => s.id.toLowerCase()),
        ...Object.keys(regData).map(k => k.toLowerCase())
      ]);

      while (existingIds.has(newId)) {
        nextNum++;
        newId = `user${nextNum}`;
      }

      return [...prev, { id: newId, name: "" }];
    });
  };

  if (loading && !isStaffModalOpen) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6 gap-6 bg-slate-900/50">
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

      <main className="flex-1 flex gap-6 overflow-hidden">
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

        <div className="flex-1 glass-card overflow-auto relative rounded-2xl">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="glass bg-slate-800">
                <th className="sticky left-0 z-30 p-4 min-w-[200px] text-left border-b border-white/5 bg-slate-800">スタッフ名</th>
                {daysArray.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-sm font-black border-b border-white/5 min-w-[48px] text-center text-slate-300"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, sIdx) => (
                <tr key={sIdx} className="hover:bg-white/5 transition-colors border-b border-white/5">
                  <td className="sticky left-0 z-10 p-4 text-sm font-medium bg-slate-900/80 backdrop-blur-md border-r border-white/5">
                    <div className="flex items-center gap-2 group">
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{s.id}</span>
                      </div>
                      {memos?.[s.id] && (
                        <button 
                          onClick={() => setIsMemoModalOpen(true)}
                          className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
                        >
                          <MessageSquare size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  {daysArray.map((day, dIdx) => {
                    const shiftId = (shifts?.[s.id] && shifts?.[s.id][dIdx]) || SHIFT_TYPES.OFF.id;
                    const shiftKey = Object.keys(SHIFT_TYPES).find(k => SHIFT_TYPES[k].id === shiftId);
                    const shift = shiftKey ? SHIFT_TYPES[shiftKey] : SHIFT_TYPES.OFF;
                    const isRequestedHoliday = requests?.[s.id]?.includes(dIdx);
                    const isOff = shiftId === SHIFT_TYPES.OFF.id;

                    return (
                      <td
                        key={dIdx}
                        onClick={() => handleCellClick(s.id, dIdx)}
                        className={`p-1 cursor-pointer transition-all relative border border-transparent ${isRequestedHoliday ? 'bg-red-500/10' : ''}`}
                      >
                        <div
                          className={`w-full h-10 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all active:scale-95 shadow-lg ${!isOff
                              ? 'glass border-white/10'
                              : isRequestedHoliday
                                ? 'bg-red-500/80 border-2 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                : 'hover:bg-white/5'
                            }`}
                          style={{
                            backgroundColor: !isOff ? `${shift.color}33` : undefined,
                            color: !isOff ? shift.color : 'transparent',
                            backdropFilter: isRequestedHoliday ? 'none' : undefined
                          }}
                        >
                          {!isOff ? shift.short : ''}
                        </div>
                        {isRequestedHoliday && (
                          <div className="absolute -top-0.5 -right-0.5 z-10 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 shadow-lg animate-pulse" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20">
              <tr className="glass border-t border-white/10">
                <td className="sticky left-0 p-4 text-xs font-bold uppercase bg-slate-800">出勤人数</td>
                {daysArray.map((_, dIdx) => {
                  let dailyCount = 0;
                  staff.forEach(s => {
                    if (shifts?.[s.id] && shifts?.[s.id][dIdx] !== SHIFT_TYPES.OFF.id) dailyCount++;
                  });
                  return (
                    <td key={dIdx} className={`p-4 text-center text-sm font-bold ${dailyCount < RULES.MIN_STAFF_PER_DAY ? 'text-red-400' : 'text-emerald-400'}`}>
                      {dailyCount}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </main>

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border-white/10">
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Users className="text-blue-400" /> スタッフID・招待管理
              </h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </header>

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
                    const isDuplicate = tempStaff.filter(item => item.id.toLowerCase() === s.id.toLowerCase()).length > 1;
                    return (
                      <tr key={index} className="group">
                        <td className="py-3 px-2">
                          <input type="text" value={s.name} onChange={(e) => { const newStaff = [...tempStaff]; newStaff[index].name = e.target.value; setTempStaff(newStaff); }} placeholder="スタッフ名" className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm w-full focus:border-blue-500 outline-none" />
                        </td>
                        <td className="py-3 px-2">
                          <div className="relative">
                            <input
                              type="text"
                              value={s.id}
                              onChange={(e) => { const newStaff = [...tempStaff]; newStaff[index].id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''); setTempStaff(newStaff); }}
                              placeholder="user01"
                              className={`bg-white/5 border rounded-lg p-2 text-sm w-full font-mono focus:border-blue-500 outline-none transition-colors ${isDuplicate ? 'border-red-500 bg-red-500/10' : 'border-white/10'
                                }`}
                            />
                            {isDuplicate && (
                              <span className="absolute -bottom-4 left-1 text-[8px] text-red-500 font-bold uppercase">ID重複あり</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {regData?.[s.id] ? (
                            <div className="flex items-center gap-3">
                              {regData?.[s.id]?.registered ? (
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
              <button onClick={handleAddStaff} className="w-full p-4 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-500 hover:bg-white/5 hover:border-white/30 transition mt-6">
                <Plus size={16} /> 新しいスタッフを追加
              </button>
            </div>

            <footer className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
              <p className="text-[10px] text-slate-500 max-w-sm">※ IDは一度設定すると変更しないでください。</p>
              <div className="space-x-3">
                <button onClick={() => setIsStaffModalOpen(false)} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition">キャンセル</button>
                <button onClick={handleSaveStaff} className="px-10 py-3 bg-blue-600 rounded-xl text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all">設定を保存して発行</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {isMemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden border-white/10">
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <MessageSquare className="text-emerald-400" /> スタッフからのメッセージ
              </h2>
              <button onClick={() => setIsMemoModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition">
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
              <button onClick={() => setIsMemoModalOpen(false)} className="px-8 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition">
                閉じる
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
