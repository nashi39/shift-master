import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Key, User, Lock, Check, AlertCircle, ShieldCheck } from 'lucide-react';

const SetupPasswordView = () => {
  const { setupPassword, sendResetEmailByKey } = useAuth();
  const [formData, setFormData] = useState({
    staffId: '',
    invitationKey: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showResetOption, setShowResetOption] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResetOption(false);
    
    if (formData.password !== formData.confirmPassword) {
      return setError('パスワードが一致しません。');
    }
    if (formData.password.length < 6) {
      return setError('パスワードは6文字以上で設定してください。');
    }

    setLoading(true);
    try {
      await setupPassword(formData.staffId, formData.invitationKey, formData.password);
      setSuccess(true);
      setTimeout(() => {
        navigate(formData.staffId.trim().toLowerCase() === 'product' ? "/admin" : "/");
      }, 2000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use' && formData.staffId !== 'product') {
        setError("このIDは既に登録されています。パスワードを忘れた場合は、リセットメールを送信してください。");
        setShowResetOption(true);
      } else {
        setError(err.message || "登録中にエラーが発生しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmail = async () => {
    setLoading(true);
    try {
      await sendResetEmailByKey(formData.staffId, formData.invitationKey);
      setResetSent(true);
    } catch (err) {
      setError(err.message || "メール送信に失敗しました。キーを再確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="glass-card p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-blue-500/20 transform -rotate-3 border border-white/10">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              INITIAL SETUP
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
              アカウントの初期設定
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6 animate-in slide-in-from-top-2">
              <AlertCircle size={16} />
              <span className="font-bold flex-1">{error}</span>
            </div>
          )}

          {resetSent ? (
            <div className="space-y-6 py-4 text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                <Check size={32} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">メールを送信しました</h3>
                <p className="text-xs text-slate-400">登録メールアドレス宛に送信しました。パスワードを設定後、ログインしてください。</p>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-6 py-4 text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check size={32} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">設定が完了しました</h3>
                <p className="text-xs text-slate-400 italic">ダッシュボードへリダイレクト中...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="staffId"
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={handleChange}
                    placeholder="管理者は product / スタッフは各自のID"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invitation Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    name="invitationKey"
                    type="text"
                    required
                    value={formData.invitationKey}
                    onChange={handleChange}
                    placeholder="発行された紹介キーを入力"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                  />
                </div>
              </div>

              {!showResetOption ? (
                <>
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          name="password"
                          type="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="6文字以上のパスワード"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                      <div className="relative">
                        <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          name="confirmPassword"
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="パスワードを再入力"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 border border-white/10"
                  >
                    {loading ? 'Processing...' : 'Complete Setup'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleResetEmail}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 border border-white/10"
                >
                  {loading ? 'Sending...' : 'パスワード再設定メールを送信'}
                </button>
              )}
            </form>
          )}

          {!success && (
            <div className="text-center mt-8 relative z-10">
              <Link to="/login" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-all">
                既に登録済みの方はこちら
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupPasswordView;
