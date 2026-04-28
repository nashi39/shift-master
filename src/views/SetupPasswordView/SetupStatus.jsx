import React from 'react';
import { Check } from 'lucide-react';

/**
 * SetupStatus
 * 
 * 役割: 処理完了後のステータス表示
 * - パスワード設定完了、またはリセットメール送信完了のメッセージを表示
 */
const SetupStatus = ({ type }) => {
  if (type === 'resetSent') {
    return (
      <div className="space-y-6 py-4 text-center animate-in zoom-in">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
          <Check size={32} strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">メールを送信しました</h3>
          <p className="text-xs text-slate-400">登録メールアドレス宛に送信しました。パスワードを設定後、ログインしてください。</p>
        </div>
      </div>
    );
  }

  if (type === 'success') {
    return (
      <div className="space-y-6 py-4 text-center animate-in zoom-in">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <Check size={32} strokeWidth={3} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">設定が完了しました</h3>
          <p className="text-xs text-slate-400 italic">ダッシュボードへリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SetupStatus;
