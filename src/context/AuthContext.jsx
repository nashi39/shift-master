import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc, updateDoc } from '../utils/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';

const AuthContext = createContext();

// Helper to generate internal email from ID (Normalized to lowercase)
const getEmailFromId = (id) => {
  const normalizedId = id.trim().toLowerCase();
  // Admin and Staff both use the same provider with alias
  return `testshift81+${normalizedId}@gmail.com`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Firebase Authのユーザー情報
  const [userData, setUserData] = useState(null); // Firestoreに保存されているユーザーの詳細プロフィール（名前、役割など）
  const [loading, setLoading] = useState(true);   // 認証状態の確認中フラグ

  // --- 認証状態の監視 (Auth Observer) ---
  useEffect(() => {
    // セッション（タブを閉じてもログインを維持するか等）の設定
    setPersistence(auth, browserSessionPersistence)
      .catch((err) => console.error("Persistence error:", err));

    // ログイン状態の変化（ログイン時、ログアウト時）を検知して状態を更新する
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          // ログインに成功したら、Firestoreからそのユーザーの詳しい情報（役割など）を取得
          const userDoc = await getDoc(doc(db, "users", authUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // プロフィール（Firestore）が見つからない場合は不整合のためログアウト
            console.warn("User profile not found. Force logging out.");
            signOut(auth);
          }
        } catch (error) {
          console.error("User data fetch error:", error);
        }
      } else {
        // ログアウト状態の場合、情報をクリア
        setUser(null);
        setUserData(null);
      }
      setLoading(false); // 確認完了
    });

    return () => unsubscribe();
  }, []);

  /**
   * 既存ユーザーのログイン処理
   * @param {string} id - ユーザーID
   * @param {string} password - パスワード
   */
  const login = async (id, password) => {
    const email = getEmailFromId(id);
    return signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * 初回登録（パスワード設定）処理
   * @param {string} id - ユーザーID
   * @param {string} invitationKey - 管理者から配布された招待キー
   * @param {string} password - 設定したいパスワード
   */
  const setupPassword = async (id, invitationKey, password) => {
    const normalizedId = id.trim().toLowerCase();
    const isAdmin = normalizedId === 'product'; // 'product' というIDは管理者として扱う
    const registrationColl = isAdmin ? "admin_registrations" : "staff_registrations";
    
    // 1. 招待キーの有効性を確認（Firestoreの登録情報をチェック）
    const regDoc = await getDoc(doc(db, registrationColl, normalizedId));
    if (!regDoc.exists()) throw new Error("IDが見つかりません");
    if (regDoc.data().invitationKey !== invitationKey) throw new Error("招待キーが正しくありません");

    const email = getEmailFromId(normalizedId);
    let user;

    try {
      // 2. Firebase Authに新規ユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } catch (authError) {
      // すでにアカウントがある場合は再設定としてログインを試みる
      if (authError.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } catch (signInError) {
          throw new Error("このIDは既に作成されています。以前と同じ、あるいはリセット後の新しいパスワードを入力してください。");
        }
      } else {
        throw authError;
      }
    }

    // 4. Firestoreにプロフィールデータを作成/更新
    const role = isAdmin ? 'admin' : 'staff';
    const profileData = {
      uid: user.uid,
      id: normalizedId,
      name: isAdmin ? "管理者" : regDoc.data().name,
      role: role,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), profileData);

    // 5. 登録完了フラグを立てる
    await updateDoc(doc(db, registrationColl, normalizedId), { registered: true });

    return user;
  };

  /**
   * 招待キーを使ってパスワードリセットメールを送信する
   */
  const sendResetEmailByKey = async (id, invitationKey) => {
    const normalizedId = id.trim().toLowerCase();
    const isAdmin = normalizedId === 'product';
    const registrationColl = isAdmin ? "admin_registrations" : "staff_registrations";

    const regDoc = await getDoc(doc(db, registrationColl, normalizedId));
    if (!regDoc.exists()) throw new Error("IDが見つかりません");
    if (regDoc.data().invitationKey !== invitationKey) throw new Error("招待キーが正しくありません");

    const email = getEmailFromId(normalizedId);
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    return true;
  };

  /**
   * ログアウト
   */
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, setupPassword, sendResetEmailByKey, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
