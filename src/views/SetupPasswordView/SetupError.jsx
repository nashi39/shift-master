import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * SetupError
 * 
 * 【役割】
 * 設定プロセス中に発生したエラーメッセージをユーザーに通知するためのUIコンポーネントです。
 * 
 * @param {Object} props
 * @param {string} props.error - 表示するエラーメッセージ文字列。空の場合は何も表示しません。
 */
const SetupError = ({ error }) => {
  if (!error) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6 animate-in slide-in-from-top-2">
      <AlertCircle size={16} />
      <span className="font-bold flex-1">{error}</span>
    </div>
  );
};

export default SetupError;
