import React from 'react';
import { Link } from 'react-router-dom';

const LoginFooter = () => {
  return (
    <div className="text-center pt-4 border-t border-white/5">
      <p className="text-xs text-slate-500">
        初めての方、パスワードを未設定の方は<br />
        <Link to="/setup" className="text-blue-400 hover:underline font-bold transition-all ml-1">
          こちらから初期設定を行ってください
        </Link>
      </p>
    </div>
  );
};

export default LoginFooter;
