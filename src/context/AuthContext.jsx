import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, doc, getDoc, setDoc } from '../utils/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

const AuthContext = createContext();

// Helper to convert Staff ID into a dummy email
const getEmailFromId = (staffId) => `${staffId.toLowerCase()}@shift-master.internal`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // 先にユーザー認証情報をセットして、他画面への遷移を許可する
        setUser(authUser);
        
        // プロフィールデータはバックグラウンドで取得
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

  const login = async (staffId, password) => {
    const email = getEmailFromId(staffId);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const setupPassword = async (staffId, invitationKey, password) => {
    // 1. Verify invitation key in Firestore
    const staffDoc = await getDoc(doc(db, "staff_registrations", staffId.toLowerCase()));
    
    if (!staffDoc.exists() || staffDoc.data().key !== invitationKey) {
      throw new Error("IDまたは招待キーが正しくありません。");
    }
    
    if (staffDoc.data().isClaimed) {
      throw new Error("このIDは既に登録済みです。通常のログインをご利用ください。");
    }

    // 2. Create the Auth account
    const email = getEmailFromId(staffId);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 3. Mark as claimed and save profile
    await setDoc(doc(db, "users", userCredential.user.uid), {
      staffId: staffId.toLowerCase(),
      name: staffDoc.data().name,
      role: 'staff',
      createdAt: new Date().toISOString()
    });

    await setDoc(doc(db, "staff_registrations", staffId.toLowerCase()), {
      isClaimed: true,
      uid: userCredential.user.uid
    }, { merge: true });

    return userCredential.user;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, setupPassword, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
