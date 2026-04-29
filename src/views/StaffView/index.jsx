import React, { useState, useEffect } from 'react';
import { useShifts } from '../../context/ShiftContext';
import { useAuth } from '../../context/AuthContext';

// Sub-components
import StaffLoading from './StaffLoading';
import StaffHeader from './StaffHeader';
import StaffProfile from './StaffProfile';
import StaffCalendar from './StaffCalendar';
import StaffMemo from './StaffMemo';
import StaffSubmit from './StaffSubmit';

/**
 * StaffView (メインコンテナ)
 * 
 * 【役割】
 * スタッフ用画面の親コンポーネントです。
 * 状態管理、カレンダー計算、ビジネスロジック（保存・ログアウト）を担当します。
 */
const StaffView = () => {
  const { 
    shifts = {}, 
    requests = {}, 
    memos = {}, 
    updateGlobalShifts, 
    loading: shiftsLoading 
  } = useShifts();
  const { userData, logout } = useAuth();
  const [localRequests, setLocalRequests] = useState([]);
  const [localMemo, setLocalMemo] = useState('');
  const [saved, setSaved] = useState(false);

  // カレンダー計算
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // データロード時の初期化
  useEffect(() => {
    if (userData && userData.id) {
      if (requests?.[userData.id]) setLocalRequests(requests?.[userData.id] || []);
      if (memos?.[userData.id]) setLocalMemo(memos?.[userData.id] || '');
    }
  }, [userData, requests, memos]);

  // 休み希望の切り替え
  const toggleHoliday = (dayIdx) => {
    if (localRequests.includes(dayIdx)) {
      setLocalRequests(localRequests.filter(d => d !== dayIdx));
    } else {
      setLocalRequests([...localRequests, dayIdx]);
    }
    setSaved(false);
  };

  // 保存処理
  const handleSave = async () => {
    if (!userData) return;
    const newRequests = { ...(requests || {}), [userData.id]: localRequests };
    const newMemos = { ...(memos || {}), [userData.id]: localMemo };
    await updateGlobalShifts(null, newRequests, newMemos);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (shiftsLoading || !userData) return <StaffLoading />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-32 font-sans">
      <StaffHeader year={year} month={month} logout={logout} />

      <div className="animate-in fade-in duration-700 space-y-6 max-w-lg mx-auto">
        <StaffProfile userData={userData} />

        <StaffCalendar 
          daysArray={daysArray}
          paddingDays={paddingDays}
          firstDayOfMonth={firstDayOfMonth}
          localRequests={localRequests}
          toggleHoliday={toggleHoliday}
          shifts={shifts}
          userData={userData}
        />

        <StaffMemo 
          localMemo={localMemo}
          setLocalMemo={setLocalMemo}
          setSaved={setSaved}
        />

        <StaffSubmit handleSave={handleSave} saved={saved} />
      </div>
    </div>
  );
};

export default StaffView;
