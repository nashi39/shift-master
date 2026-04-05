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
  if (normalizedId === 'product') {
    return 'product@admin.shift-master.internal';
  }
  return `${normalizedId}@shift-master.internal`;
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
      // 3. Fallback: If user already exists, allow re-setup using sign-in
      if (authError.code === 'auth/email-already-in-use' && isAdmin) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          user = userCredential.user;
        } catch (signInError) {
          throw new Error("このIDは既に作成されていますが、以前と異なるパスワードが入力されました。");
        }
      } else {
        throw authError;
      }
    }

    // 4. Update/Save User Profile with Role
    const role = isAdmin ? 'admin' : 'staff';
    const userData = {
      uid: user.uid,
      id: normalizedId,
      name: isAdmin ? "管理者" : regDoc.data().name,
      role: role,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, "users", user.uid), userData);

    // 5. Mark as registered
    await updateDoc(doc(db, registrationColl, normalizedId), { registered: true });

    return user;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, setupPassword, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
