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
  // コンテキストからシフト情報、ユーザーデータ、更新関数などを取得
  const { 
    shifts = {}, 
    requests = {}, 
    memos = {}, 
    updateGlobalShifts, 
    loading: shiftsLoading 
  } = useShifts();
  const { userData, logout } = useAuth();

  // ローカルステート: サーバー保存前の編集状態を保持
  const [localRequests, setLocalRequests] = useState([]); // 休み希望日のインデックス
  const [localMemo, setLocalMemo] = useState('');           // 連絡事項テキスト
  const [saved, setSaved] = useState(false);               // 保存完了のアニメーション制御用

  // カレンダー計算ロジック
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 月の初日の曜日 (0:日 ~ 6:土)
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 月の総日数
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1); // [1, 2, ..., 31]
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i); // カレンダー開始位置調整用

  /**
   * 初期データ同期
   * サーバーから取得したデータをローカルステートに反映させます。
   * ログインユーザーのIDに基づき、自身の希望日とメモを抽出します。
   */
  useEffect(() => {
    if (userData && userData.id) {
      if (requests?.[userData.id]) setLocalRequests(requests?.[userData.id] || []);
      if (memos?.[userData.id]) setLocalMemo(memos?.[userData.id] || '');
    }
  }, [userData, requests, memos]);

  /**
   * 休み希望のトグル処理
   * カレンダーの日付がタップされた際、希望リストへの追加・削除を行います。
   */
  const toggleHoliday = (dayIdx) => {
    if (localRequests.includes(dayIdx)) {
      setLocalRequests(localRequests.filter(d => d !== dayIdx));
    } else {
      setLocalRequests([...localRequests, dayIdx]);
    }
    setSaved(false); // 変更があったため保存済みフラグをリセット
  };

  /**
   * 保存（送信）処理
   * 編集した内容を Firebase などのサーバーサイドへ送信・反映します。
   */
  const handleSave = async () => {
    if (!userData) return;
    const newRequests = { ...(requests || {}), [userData.id]: localRequests };
    const newMemos = { ...(memos || {}), [userData.id]: localMemo };
    await updateGlobalShifts(null, newRequests, newMemos);
    
    setSaved(true); // 送信成功アニメーション開始
    setTimeout(() => setSaved(false), 3000); // 3秒後に通常状態に戻す
  };

  // 読み込み中、または認証情報がない場合はローディング画面を表示
  if (shiftsLoading || !userData) return <StaffLoading />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-32 font-sans">
      {/* 画面ヘッダー: ログアウトや年月表示 */}
      <StaffHeader year={year} month={month} logout={logout} />

      <div className="animate-in fade-in duration-700 space-y-6 max-w-lg mx-auto">
        {/* プロフィール表示: ログインユーザーの確認 */}
        <StaffProfile userData={userData} />

        {/* メインカレンダー: シフト確認と休み希望入力 */}
        <StaffCalendar 
          daysArray={daysArray}
          paddingDays={paddingDays}
          firstDayOfMonth={firstDayOfMonth}
          localRequests={localRequests}
          toggleHoliday={toggleHoliday}
          shifts={shifts}
          userData={userData}
        />

        {/* メモ入力: 管理者への理由送信など */}
        <StaffMemo 
          localMemo={localMemo}
          setLocalMemo={setLocalMemo}
          setSaved={setSaved}
        />

        {/* フローティング送信ボタン */}
        <StaffSubmit handleSave={handleSave} saved={saved} />
      </div>
    </div>
  );
};

export default StaffView;
