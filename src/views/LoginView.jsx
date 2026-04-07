import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { db, getDoc, doc } from '../utils/firebase';

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
        // プロフィールがない場合は再設定が必要な状態
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
        <div className="text-center">
          <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            SHIFT MASTER
          </h1>
          <p className="text-slate-500 text-sm font-medium">スタッフログイン</p>
        </div>

        {error && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{error}</p>
                {error.includes("初期設定") && (
                  <button
                    onClick={() => navigate('/setup')}
                    className="mt-3 w-full py-2.5 bg-blue-500 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    セットアップ画面へ移動する
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Staff ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="例: user01"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="text-center pt-4 border-t border-white/5">
          <p className="text-xs text-slate-500">
            初めての方、パスワードを未設定の方は<br />
            <Link to="/setup" className="text-blue-400 hover:underline font-bold transition-all ml-1">
              こちらから初期設定を行ってください
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
