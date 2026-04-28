import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, getDoc, doc } from '../../utils/firebase';

// Sub-components
import LoginHeader from './LoginHeader';
import LoginError from './LoginError';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';

const LoginView = () => {
  const { login } = useAuth();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalizedId = staffId.trim().toLowerCase();
      const userCredential = await login(normalizedId, password);
      
      // Get role from users collection after successful login
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (!userDoc.exists()) {
        setError("アカウントの初期設定（または再設定）が必要です。下のリンクからセットアップを行ってください。");
        setLoading(false);
        return;
      }

      const role = userDoc.data().role || 'staff';

      setTimeout(() => {
        navigate(role === 'admin' ? "/admin" : "/");
      }, 500);
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("IDまたはパスワードが正しくありません。");
      } else {
        setError("ログインに失敗しました。IDとパスワードを確認してください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <LoginHeader />
        
        <LoginError error={error} />

        <LoginForm 
          staffId={staffId} 
          setStaffId={setStaffId} 
          password={password} 
          setPassword={setPassword} 
          loading={loading} 
          onSubmit={handleSubmit} 
        />

        <LoginFooter />
      </div>
    </div>
  );
};

export default LoginView;
