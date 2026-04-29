import React from 'react';
import { User, Key, Lock, Check } from 'lucide-react';

/**
 * SetupForm
 * 
 * 【役割】
 * ユーザーからの入力を受け付けるフォーム本体のコンポーネントです。
 * 
 * 【機能】
 * - 入力フィールド（Account ID, Invitation Key, Password）の提供。
 * - ローディング状態に応じたボタンの無効化。
 * - 既にアカウントが存在する場合の「パスワード再設定」への切り替え表示。
 * 
 * @param {Object} props
 * @param {Object} props.formData - 入力データのオブジェクト。
 * @param {Function} props.handleChange - 入力変更時のハンドラー。
 * @param {Function} props.handleSubmit - フォーム送信時のハンドラー。
 * @param {Function} props.handleResetEmail - リセットメール送信時のハンドラー。
 * @param {boolean} props.showResetOption - すでに登録済みの際にリセットオプションを表示するかどうか。
 * @param {boolean} props.loading - 処理実行中の状態。
 */
const SetupForm = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  handleResetEmail, 
  showResetOption, 
  loading 
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
      {/* Account ID */}
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

      {/* Invitation Key */}
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
            {/* New Password */}
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

            {/* Confirm Password */}
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
  );
};

export default SetupForm;
