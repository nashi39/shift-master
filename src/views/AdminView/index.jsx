import React, { useState, useEffect } from 'react';
import { useShifts } from '../../context/ShiftContext';
import { db, doc, setDoc, getDocs, collection, deleteDoc, query, where, sendPasswordResetEmail, auth } from '../../utils/firebase';
import { SHIFT_TYPES } from '../../utils/constants';
import { generateDraftShift, checkShiftRules } from '../../utils/allocationEngine';
import { useAuth } from '../../context/AuthContext';

// Import sub-components
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import ShiftTable from './ShiftTable';
import StaffManagementModal from './StaffManagementModal';
import MessageListModal from './MessageListModal';

/**
 * AdminView (メインコンテナ)
 * 
 * 【役割】
 * 管理者専用のシフト管理ダッシュボードであり、シフトの作成・調整、スタッフ管理、および運営ルールチェックを行う統括画面です。
 * 
 * 【主な機能】
 * 1. シフト編集: カレンダー形式のテーブル上で、各スタッフのシフトを直感的にドラッグ・クリック操作で編集・保存できます。
 * 2. 自動生成機能: AIエンジン（allocationEngine）を使用して、スタッフの休み希望を考慮したシフト案を自動生成します。
 * 3. ルールチェック: 連勤制限や最低出勤人数などのルール違反をリアルタイムで検知し、視覚的な警告を表示します。
 * 4. スタッフ管理: スタッフ情報のCRUD操作、招待キーの発行、およびパスワードリセットによる再招待フローを提供します。
 * 5. コミュニケーション: スタッフから送信されたメモや連絡事項を一括で確認し、運用の可視化をサポートします。
 * 
 * 【データの流れ】
 * - ShiftContext経由でFirestoreの全データ（shifts, requests, memos, staff）を取得・監視。
 * - ユーザーの入力や自動生成処理が発生するたび、updateGlobalShifts関数を介してFirestoreとリアルタイム同期。
 */
const AdminView = () => {
  // シフトデータのリアルタイム読込・更新用Context
  const { 
    shifts = {},        // 全員の確定済みシフトデータ
    requests = {},       // スタッフからの休み希望
    memos = {},          // スタッフからの連絡事項
    staff = [],          // スタッフ一覧（マスターデータ）
    updateGlobalShifts,  // シフト表全体をFirestoreに保存する関数
    updateStaffConfig,   // スタッフ構成（名前等）をFirestoreに保存する関数
    loading              // データ読込中のフラグ
  } = useShifts();
  
  // 認証用Context
  const { logout } = useAuth();
  
  // 表示中の月（現在は実行時の当月固定）
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // --- データベース自動修復 (Temporary Auto-Repair) ---
  useEffect(() => {
    const repairDatabase = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // 管理者プロフィールを強制的に作成/更新（UIDとの紐付けを確実にするため）
        await setDoc(doc(db, "users", user.uid), {
          id: "product",
          name: "管理者",
          role: "admin",
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Auto-Repair Error:", err);
      }
    };
    repairDatabase();
  }, []);
  // 現在の入力モード（早番・遅番など、クリック時に適用されるシフトタイプ）
  const [activeShift, setActiveShift] = useState(SHIFT_TYPES.DAY.id);

  // モーダル表示とローカル編集用のステート
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false); // スタッフ管理モーダル
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);   // メッセージ一覧モーダル
  const [isLocalLoading, setIsLocalLoading] = useState(false);     // 非同期処理中（メール送信等）の読込状態
  const [tempStaff, setTempStaff] = useState([]);                  // 編集中のスタッフ構成（保存前の一時データ）
  const [regData, setRegData] = useState({});                      // 招待キーや登録状況のデータ

  // カレンダー計算：その月の日数と日付配列を生成
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 6桁の招待キー（英数字）を生成するユーティリティ
  const generateKey = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  /**
   * シフト表のセルをクリックした際の入力処理
   * 同じシフトなら休みに戻し、違うなら上書きするトグル動作
   */
  const handleCellClick = (staffId, day) => {
    const currentShift = shifts?.[staffId]?.[day] || SHIFT_TYPES.OFF.id;
    const nextShift = currentShift === activeShift ? SHIFT_TYPES.OFF.id : activeShift;

    const newShifts = { ...(shifts || {}) };
    if (!newShifts[staffId]) newShifts[staffId] = new Array(daysInMonth).fill(SHIFT_TYPES.OFF.id);
    newShifts[staffId][day] = nextShift;

    // 変更を即座にFirestoreへ同期
    updateGlobalShifts(newShifts, requests);
  };

  /**
   * AIによるシフト自動生成（下書き生成）を起動
   */
  const handleMagicFill = () => {
    const staffIds = staff?.map(s => s.id) || [];
    const draft = generateDraftShift(staffIds, requests || {}, daysInMonth);
    updateGlobalShifts(draft, requests || {});
  };

  // シフトルールの違反チェック（連勤数や人数不足など）をリアルタイム実行
  const alerts = checkShiftRules(shifts, daysInMonth);

  /**
   * スタッフ管理モーダルを開く際の初期化処理
   * Firestoreから最新の登録・招待キー情報を取得する
   */
  const { userData } = useAuth(); // 現在のユーザー情報を取得
  /**
   * スタッフ管理モーダルを開く
   * 現在のスタッフ一覧を編集用の一時ステートにコピーし、登録状況をFirestoreから取得します。
   */
  const openStaffModal = async () => {
    // staffが配列であることを保証してコピー（クラッシュ防止）
    const currentStaff = Array.isArray(staff) ? staff : [];
    setTempStaff(currentStaff.map(s => ({ ...s }))); 
    
    setIsLocalLoading(true);
    try {
      const regSnap = await getDocs(collection(db, "staff_registrations"));
      const regs = {};
      regSnap.forEach(doc => { regs[doc.id] = doc.data(); });
      setRegData(regs);
      setIsStaffModalOpen(true);
    } catch (err) {
      console.error("Error loading registration data:", err);
      alert("登録情報の取得に失敗しました。");
    } finally {
      setIsLocalLoading(false);
    }
  };

  /**
   * スタッフの再招待・パスワードリセット処理
   */
  const handleReinvite = async (staffId) => {
    const normalizedId = staffId.toLowerCase();
    const email = `testshift81+${normalizedId}@gmail.com`;

    if (!window.confirm(`${staffId} の登録をリセットして再招待しますか？\n\n送信先: ${email}`)) return;

    setIsLocalLoading(true);
    try {
      // Firebase Authのパスワードリセット機能を実行
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          throw new Error(`送信失敗: ${email} というユーザーが存在しません。`);
        }
        throw authError;
      }

      // 新しい招待キーを生成してFirestoreを更新
      const newKey = generateKey();
      await setDoc(doc(db, "staff_registrations", normalizedId), {
        name: tempStaff.find(s => s.id === staffId)?.name || "",
        invitationKey: newKey,
        registered: false
      });

      // 既存のユーザープロファイルを削除
      const uQuery = query(collection(db, "users"), where("id", "==", normalizedId));
      const uSnap = await getDocs(uQuery);
      for (const uDoc of uSnap.docs) {
        await deleteDoc(doc(db, "users", uDoc.id));
      }

      // 画面上の登録データを更新
      const regSnap = await getDocs(collection(db, "staff_registrations"));
      const regs = {};
      regSnap.forEach(doc => { regs[doc.id] = doc.data(); });
      setRegData(regs);

      const setupUrl = `${window.location.origin}/setup`;
      const inviteMsg = `【シフト管理システム 再設定のご案内】\n\nパスワード再設定メールを送信しました。\nメール内のリンクからパスワードを更新した後、以下の招待キーを使用して再度セットアップを行ってください。\n\n■招待キー: ${newKey}\n■セットアップURL: ${setupUrl}`;

      try {
        await navigator.clipboard.writeText(inviteMsg);
        alert(`成功: 再設定メールを送信しました。案内文をクリップボードにコピーしました。`);
      } catch (copyErr) {
        alert(`成功: 再設定メールを送信しました。\n新しい招待キー: ${newKey}`);
      }
    } catch (err) {
      console.error("Reinvite Error:", err);
      alert(`失敗: ${err.message || err.code}`);
    } finally {
      setIsLocalLoading(false);
    }
  };

  /**
   * 編集したスタッフ構成をFirestoreに保存
   */
  const handleSaveStaff = async () => {
    const validStaff = tempStaff.filter(s => s.name.trim() !== "" && s.id.trim() !== "");
    const lowerIds = validStaff.map(s => s.id.toLowerCase());
    const hasDuplicate = lowerIds.some((id, index) => lowerIds.indexOf(id) !== index);
    
    if (hasDuplicate) {
      alert("エラー: 画面内で重複しているIDがあります。");
      return;
    }

    setIsLocalLoading(true);
    try {
      // 削除対象のスタッフを特定
      const currentIds = staff.map(s => s.id.toLowerCase());
      const newIds = validStaff.map(s => s.id.toLowerCase());
      const removedIds = currentIds.filter(id => !newIds.includes(id));

      // 削除されたスタッフのデータをFirestoreから一掃
      for (const rid of removedIds) {
        await deleteDoc(doc(db, "staff_registrations", rid));
        const uQuery = query(collection(db, "users"), where("id", "==", rid));
        const uSnap = await getDocs(uQuery);
        for (const uDoc of uSnap.docs) {
          await deleteDoc(doc(db, "users", uDoc.id));
        }
      }

      // スタッフマスターを更新
      await updateStaffConfig(validStaff);

      // 新規追加されたスタッフに招待キーを発行
      for (const s of validStaff) {
        const sid = s.id.toLowerCase();
        if (!regData?.[sid]) {
          const newKey = generateKey();
          await setDoc(doc(db, "staff_registrations", sid), {
            name: s.name,
            invitationKey: newKey,
            registered: false
          });
        }
      }
      
      alert("スタッフ設定を保存しました。");
      setIsStaffModalOpen(false);
    } catch (err) {
      console.error("Save Staff Error:", err);
      alert(`保存に失敗しました: ${err.message || err.code}`);
    } finally {
      setIsLocalLoading(false);
    }
  };

  /**
   * モーダル内で新規スタッフ入力行を追加する処理
   */
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

  // データ読込中のプレースホルダー表示
  if (loading && !isStaffModalOpen) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6 gap-6 bg-slate-900/50">
      {/* 上部ヘッダー */}
      <AdminHeader 
        selectedMonth={selectedMonth} 
        handleMagicFill={handleMagicFill} 
        logout={logout} 
      />

      <main className="flex-1 flex gap-6 overflow-hidden">
        {/* 左側サイドバー */}
        <AdminSidebar 
          activeShift={activeShift} 
          setActiveShift={setActiveShift} 
          openStaffModal={openStaffModal} 
          setIsMemoModalOpen={setIsMemoModalOpen} 
          alerts={alerts} 
        />

        {/* 中央メインテーブル */}
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

      {/* 各種モーダルコンポーネント */}
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
