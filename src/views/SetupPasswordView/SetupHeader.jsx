import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * SetupHeader
 * 
 * 【役割】
 * 初期設定画面の最上部に表示されるヘッダーコンポーネントです。
 * 
 * 【デザイン】
 * - システムの堅牢性を象徴するシールドアイコンを配置。
 * - ユーザーに対して「これがアカウントの最初のステップであること」を明示するためのタイトルを表示。
 */
const SetupHeader = () => {
  return (
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
  );
};

export default SetupHeader;
