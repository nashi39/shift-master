import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Sub-components
import SetupHeader from './SetupHeader';
import SetupError from './SetupError';
import SetupStatus from './SetupStatus';
import SetupForm from './SetupForm';
import SetupFooter from './SetupFooter';

/**
 * SetUpPasswordView (Main Container)
 * 
 * 役割: 初期設定画面の司令塔
 * - フォームの入力状態管理
 * - パスワード設定およびリセットメール送信のロジック実行
 * - 成功・失敗に応じた画面表示の切り替え
 */
const SetUpPasswordView = () => {
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
          
          <SetupHeader />

          <SetupError error={error} />

          {resetSent ? (
            <SetupStatus type="resetSent" />
          ) : success ? (
            <SetupStatus type="success" />
          ) : (
            <SetupForm 
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              handleResetEmail={handleResetEmail}
              showResetOption={showResetOption}
              loading={loading}
            />
          )}

          <SetupFooter hide={success} />
        </div>
      </div>
    </div>
  );
};

export default SetUpPasswordView;
