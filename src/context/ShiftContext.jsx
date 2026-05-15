import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, auth } from '../utils/firebase';
import { useAuth } from './AuthContext';

const ShiftContext = createContext();

export const ShiftProvider = ({ children }) => {
  // --- 状態管理 (State) ---
  const [shifts, setShifts] = useState({});   // 確定したシフトデータ (日付: {userId: type})
  const [requests, setRequests] = useState({}); // スタッフからの休み希望データ
  const [memos, setMemos] = useState({});     // 日付ごとのメモ・連絡事項
  const [staff, setStaff] = useState([]);    // スタッフ一覧（名前とIDのマスターデータ）
  const [loading, setLoading] = useState(true); // データの初期読み込み中かどうかを判定するフラグ
  const { user } = useAuth(); // AuthContextからログイン状態を取得

  // --- データのリアルタイム購読 (Firebase Realtime Listener) ---
  useEffect(() => {
    // 認証状態の変化を監視し、ログイン完了後にFirestoreの購読を開始する
    const unsubscribeAuth = auth.onIdTokenChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        console.log("ShiftContext: User logged out. Clearing data...");
        setShifts({});
        setRequests({});
        setMemos({});
        setStaff([]);
        setLoading(false);
        return;
      }

      console.log("ShiftContext: User authenticated. Starting Firestore listener...");
      setLoading(true);

      // 今月のデータ全体を監視
      const unsubData = onSnapshot(doc(db, "global", "current_month"), (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("ShiftContext: New data received from Firestore");

            // データの正規化（Firestoreが配列をオブジェクトとして保存する場合があるため）
            const normalize = (val) => {
              if (!val) return {};
              // スタッフごとのデータ（shifts[staffId]など）をループ
              const normalized = {};
              Object.keys(val).forEach(id => {
                normalized[id] = Array.isArray(val[id]) ? val[id] : Object.values(val[id]);
              });
              return normalized;
            };

            setShifts(normalize(data?.shifts));
            setRequests(data?.requests || {}); // requestsはスタッフIDごとの配列リスト
            setMemos(data?.memos || {});
            
            if (data?.staff) {
              const staffArray = Array.isArray(data.staff) ? data.staff : Object.values(data.staff);
              setStaff(staffArray.filter(s => s && typeof s === 'object'));
            }
          } else {
            console.warn("ShiftContext: current_month doc not found");
            setShifts({});
            setRequests({});
            setMemos({});
            setStaff([]);
          }
        } catch (err) {
          console.error("ShiftContext: Processing error", err);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error("ShiftContext: Snapshot error", error);
        setLoading(false);
      });

      return () => unsubData();
    });

    return () => unsubscribeAuth();
  }, []); // authのリスナー自体は一度だけセット

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
