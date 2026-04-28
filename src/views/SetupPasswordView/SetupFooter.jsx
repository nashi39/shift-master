import React from 'react';
import { Link } from 'react-router-dom';

/**
 * SetupFooter
 * 
 * 役割: 画面下部のナビゲーション
 * - すでに登録済みのユーザーをログイン画面へ誘導
 */
const SetupFooter = ({ hide }) => {
  if (hide) return null;
  return (
    <div className="text-center mt-8 relative z-10">
      <Link to="/login" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-all">
        既に登録済みの方はこちら
      </Link>
    </div>
  );
};

export default SetupFooter;
