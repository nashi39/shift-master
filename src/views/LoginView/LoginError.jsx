import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LoginError
 * 
 * 役割: ログインエラーの表示
 * - エラーメッセージがある場合のみ警告枠を表示
 * - 「初期設定が必要」というエラーの場合にセットアップ画面への誘導ボタンを表示
 */
const LoginError = ({ error }) => {
  const navigate = useNavigate();

  if (!error) return null;

  return (
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
  );
};

export default LoginError;
