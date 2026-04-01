import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Key, User, Lock, Check, AlertCircle } from 'lucide-react';

const SetupPasswordView = () => {
  const { setupPassword } = useAuth();
  const [formData, setFormData] = useState({
    staffId: '',
    invitationKey: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('パスワードが一致しません。');
    }
    if (formData.password.length < 6) {
      return setError('パスワードは6文字以上で設定してください。');
    }

    setLoading(true);
    try {
      await setupPassword(formData.staffId, formData.invitationKey, formData.password);
      navigate('/'); // Or success page
    } catch (err) {
      setError(err.message || '初期設定に失敗しました。内容を再確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            INITIAL SETUP
          </h1>
          <p className="text-slate-500 text-sm font-medium">初期パスワードの設定</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">配布された Staff ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                name="staffId"
                type="text"
                required
                value={formData.staffId}
                onChange={handleChange}
                placeholder="例: user01"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">配布された 招待キー</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                name="invitationKey"
                type="text"
                required
                value={formData.invitationKey}
                onChange={handleChange}
                placeholder="英数字のキー"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">新しいパスワード</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="6文字以上"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">パスワード（確認）</label>
            <div className="relative">
              <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="もう一度入力してください"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl font-bold text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '登録中...' : '設定を完了してログイン'}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link to="/login" className="text-xs text-slate-500 hover:text-white transition-all">
            既に登録済みの方はログインへ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupPasswordView;
