import React, { useState } from 'react';
import { useShifts } from '../../context/ShiftContext';
import { db, doc, setDoc, getDocs, collection } from '../../utils/firebase';
import { SHIFT_TYPES } from '../../utils/constants';
import { generateDraftShift, checkShiftRules } from '../../utils/allocationEngine';
import { useAuth } from '../../context/AuthContext';

// Import sub-components
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import ShiftTable from './ShiftTable';
import StaffManagementModal from './StaffManagementModal';
import MessageListModal from './MessageListModal';

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
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../../utils/firebase');

      try {
        await sendPasswordResetEmail(auth, email);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          throw new Error(`送信失敗: ${email} というユーザーが存在しません。Firebaseコンソールのメールアドレスを確認してください。`);
        }
        throw authError;
      }

      const newKey = generateKey();
      await setDoc(doc(db, "staff_registrations", normalizedId), {
        name: tempStaff.find(s => s.id === staffId)?.name || "",
        invitationKey: newKey,
        registered: false
      });

      const { query, where, getDocs, deleteDoc } = await import('firebase/firestore');
      const uQuery = query(collection(db, "users"), where("id", "==", normalizedId));
      const uSnap = await getDocs(uQuery);
      for (const uDoc of uSnap.docs) {
        await deleteDoc(doc(db, "users", uDoc.id));
      }

      const regSnap = await getDocs(collection(db, "staff_registrations"));
      const regs = {};
      regSnap.forEach(doc => { regs[doc.id] = doc.data(); });
      setRegData(regs);

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
    const lowerIds = validStaff.map(s => s.id.toLowerCase());
    const hasDuplicate = lowerIds.some((id, index) => lowerIds.indexOf(id) !== index);
    
    if (hasDuplicate) {
      alert("エラー: 画面内で重複しているIDがあります。各スタッフに一意のIDを設定してください。");
      return;
    }

    const currentIds = staff.map(s => s.id.toLowerCase());
    const newIds = validStaff.map(s => s.id.toLowerCase());
    const removedIds = currentIds.filter(id => !newIds.includes(id));

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

  if (loading && !isStaffModalOpen) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6 gap-6 bg-slate-900/50">
      <AdminHeader 
        selectedMonth={selectedMonth} 
        handleMagicFill={handleMagicFill} 
        logout={logout} 
      />

      <main className="flex-1 flex gap-6 overflow-hidden">
        <AdminSidebar 
          activeShift={activeShift} 
          setActiveShift={setActiveShift} 
          openStaffModal={openStaffModal} 
          setIsMemoModalOpen={setIsMemoModalOpen} 
          alerts={alerts} 
        />

        <ShiftTable 
          daysArray={daysArray} 
          staff={staff} 
          memos={memos} 
          shifts={shifts} 
          requests={requests} 
          activeShift={activeShift} 
          handleCellClick={handleCellClick} 
          setIsMemoModalOpen={setIsMemoModalOpen} 
        />
      </main>

      <StaffManagementModal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
        tempStaff={tempStaff} 
        setTempStaff={setTempStaff} 
        regData={regData} 
        isLocalLoading={isLocalLoading} 
        handleReinvite={handleReinvite} 
        handleSaveStaff={handleSaveStaff} 
        handleAddStaff={handleAddStaff} 
      />

      <MessageListModal 
        isOpen={isMemoModalOpen} 
        onClose={() => setIsMemoModalOpen(false)} 
        staff={staff} 
        memos={memos} 
      />
    </div>
  );
};

export default AdminView;
