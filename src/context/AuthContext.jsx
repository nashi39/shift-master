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
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログイン情報を保持する設定
    setPersistence(auth, browserSessionPersistence)
      .catch((err) => console.error("Persistence error:", err));

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          const userDoc = await getDoc(doc(db, "users", authUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // プロファイル（Firestore）が消されている場合は強制ログアウト
            console.warn("User profile not found. Force logging out.");
            signOut(auth);
          }
        } catch (error) {
          console.error("User data fetch error:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (id, password) => {
    const email = getEmailFromId(id);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const setupPassword = async (id, invitationKey, password) => {
    const normalizedId = id.trim().toLowerCase();
    const isAdmin = normalizedId === 'product';
    const registrationColl = isAdmin ? "admin_registrations" : "staff_registrations";
    
    // 1. Verify invitation key
    const regDoc = await getDoc(doc(db, registrationColl, normalizedId));
    if (!regDoc.exists()) throw new Error("IDが見つかりません");
    if (regDoc.data().invitationKey !== invitationKey) throw new Error("招待キーが正しくありません");

    const email = getEmailFromId(normalizedId);
    let user;

    try {
      // 2. Try to create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } catch (authError) {
      // 3. Fallback: If user already exists (Re-invite case), allow re-setup using sign-in
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

    // 4. Update/Save User Profile with Role
    const role = isAdmin ? 'admin' : 'staff';
    const profileData = {
      uid: user.uid,
      id: normalizedId,
      name: isAdmin ? "管理者" : regDoc.data().name,
      role: role,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), profileData);

    // 5. Mark as registered
    await updateDoc(doc(db, registrationColl, normalizedId), { registered: true });

    return user;
  };

  // New: Send password reset email after verifying invitation key
  const sendResetEmailByKey = async (id, invitationKey) => {
    const normalizedId = id.trim().toLowerCase();
    const isAdmin = normalizedId === 'product';
    const registrationColl = isAdmin ? "admin_registrations" : "staff_registrations";

    // Verify key in Firestore
    const regDoc = await getDoc(doc(db, registrationColl, normalizedId));
    if (!regDoc.exists()) throw new Error("IDが見つかりません");
    if (regDoc.data().invitationKey !== invitationKey) throw new Error("招待キーが正しくありません");

    const email = getEmailFromId(normalizedId);
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    return true;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, setupPassword, sendResetEmailByKey, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
