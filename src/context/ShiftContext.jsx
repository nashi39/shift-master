import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc } from '../utils/firebase';
import { RULES } from '../utils/constants';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  // --- 状態管理 (State) ---
  const [shifts, setShifts] = useState({});   // 確定したシフトデータ (日付: {userId: type})
  const [requests, setRequests] = useState({}); // スタッフからの休み希望データ
  const [memos, setMemos] = useState({});     // 日付ごとのメモ・連絡事項
  const [staff, setStaff] = useState([]);    // スタッフ一覧（名前とIDのマスターデータ）
  const [loading, setLoading] = useState(true); // データの初期読み込み中かどうかを判定するフラグ

  // Load staff configuration and monthly data
  // --- データのリアルタイム購読 (Firebase Realtime Listener) ---
  useEffect(() => {
    // スタッフの構成設定（名前など）を監視
    const unsubConfig = onSnapshot(doc(db, "global", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setStaff(docSnap.data().staff || []);
      } else {
        // 設定が存在しない場合は初期データを作成
        const defaultStaff = Array.from({ length: 5 }, (_, i) => ({
          id: `user${i + 1}`,
          name: `スタッフ ${i + 1}`
        }));
        setStaff(defaultStaff);
        setDoc(doc(db, "global", "config"), { staff: defaultStaff });
      }
    });

    // 今月のシフトデータ全体（シフト、休み希望、メモ）を監視
    const unsubData = onSnapshot(doc(db, "global", "current_month"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShifts(data?.shifts || {});
        setRequests(data?.requests || {});
        setMemos(data?.memos || {});
      } else {
        setShifts({});
        setRequests({});
        setMemos({});
      }
      setLoading(false);
    }, (error) => {
      console.error("Shift data error:", error);
      setLoading(false);
    });

    // クリーンアップ処理：画面を離れる時に監視を停止する
    return () => {
      unsubConfig();
      unsubData();
    };
  }, []);

  // --- データ更新用関数 (Actions) ---

  /**
   * シフト表全体のデータをFirestoreに保存する
   * @param {Object} newShifts - 新しいシフト表
   * @param {Object} newRequests - 更新された休み希望
   * @param {Object} newMemos - 更新されたメモ
   */
  const updateGlobalShifts = async (newShifts, newRequests, newMemos) => {
    await setDoc(doc(db, "global", "current_month"), {
      shifts: newShifts || shifts,
      requests: newRequests || requests,
      memos: newMemos || memos,
    }, { merge: true }); // merge: true を指定して既存のデータを壊さないように更新
  };

  /**
   * スタッフのマスター情報（名前等）を更新する
   * @param {Array} newStaff - 新しいスタッフ名簿
   */
  const updateStaffConfig = async (newStaff) => {
    await setDoc(doc(db, "global", "config"), { staff: newStaff });
  };

  return (
    <ShiftContext.Provider value={{ shifts, requests, memos, staff, loading, updateGlobalShifts, updateStaffConfig }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShifts = () => useContext(ShiftContext);
