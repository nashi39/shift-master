import React from 'react';

/**
 * LoginHeader
 * 
 * 役割: ログイン画面のヘッダー表示
 * - アプリ名「SHIFT MASTER」のロゴ表示
 * - 画面の趣旨（スタッフログイン）の表示
 */
const LoginHeader = () => {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
        SHIFT MASTER
      </h1>
      <p className="text-slate-500 text-sm font-medium">スタッフログイン</p>
    </div>
  );
};

export default LoginHeader;
