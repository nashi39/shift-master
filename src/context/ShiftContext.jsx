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
  // --- データのリアルタイム購読 (Firebase Realtime Listener) ---
  useEffect(() => {
    console.log("ShiftContext: Starting real-time listener...");

    // 今月のデータ全体（シフト、休み希望、メモ、スタッフ名簿）を監視
    const unsubData = onSnapshot(doc(db, "global", "current_month"), (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShifts(data?.shifts || {});
          setRequests(data?.requests || {});
          setMemos(data?.memos || {});
          
          if (data?.staff) {
            const staffData = Array.isArray(data.staff) ? data.staff : Object.values(data.staff);
            setStaff(staffData.filter(s => s && typeof s === 'object'));
          }
        } else {
          console.warn("ShiftContext: Document 'current_month' does not exist.");
          setShifts({});
          setRequests({});
          setMemos({});
          setStaff([]);
        }
      } catch (err) {
        console.error("ShiftContext: Data processing error:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      // 権限エラーなどはここでキャッチされる
      console.warn("ShiftContext: Snapshot listener error (this is normal if logged out):", error.message);
      setLoading(false);
    });

    // クリーンアップ処理
    return () => {
      unsubData();
    };
  }, []); // 以前の安定した設定（空の依存配列）に戻します

  // --- データ更新用関数 (Actions) ---

  /**
   * 全てのデータを一つのドキュメントに保存する
   */
  const updateGlobalShifts = async (newShifts, newRequests, newMemos) => {
    await setDoc(doc(db, "global", "current_month"), {
      shifts: newShifts || shifts,
      requests: newRequests || requests,
      memos: newMemos || memos,
    }, { merge: true });
  };

  /**
   * スタッフのマスター情報をcurrent_monthに保存する
   */
  const updateStaffConfig = async (newStaff) => {
    await setDoc(doc(db, "global", "current_month"), { 
      staff: newStaff 
    }, { merge: true });
  };

  return (
    <ShiftContext.Provider value={{ shifts, requests, memos, staff, loading, updateGlobalShifts, updateStaffConfig }}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShifts = () => useContext(ShiftContext);
