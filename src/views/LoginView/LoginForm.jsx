import React from 'react';
import { User, Lock } from 'lucide-react';

/**
 * LoginForm
 * 
 * 役割: ログイン情報の入力フォーム
 * - IDとパスワードの入力フィールドを提供
 * - 送信ボタン（ログインボタン）の表示とローディング状態の制御
 * 
 * Props:
 * - staffId, setStaffId: IDの保持と更新
 * - password, setPassword: パスワードの保持と更新
 * - loading: 送信中のボタン無効化フラグ
 * - onSubmit: フォーム送信時の処理（親から渡されるhandleSubmit）
 */
const LoginForm = ({ staffId, setStaffId, password, setPassword, loading, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
  );
};

export default LoginForm;
