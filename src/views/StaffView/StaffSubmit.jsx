import React from 'react';
import { Save, Check } from 'lucide-react';

/**
 * StaffSubmit
 * 
 * 【役割】
 * 休み希望とメモを確定して送信するためのボタンコンポーネントです。
 * 画面下部に固定（Sticky）されます。
 * 
 * @param {Object} props
 * @param {Function} props.handleSave - 保存処理を実行する関数
 * @param {boolean} props.saved - 保存済みかどうか
 */
const StaffSubmit = ({ handleSave, saved }) => {
  return (
    <div className="fixed bottom-8 left-4 right-4 max-w-lg mx-auto z-50">
      <button
        onClick={handleSave}
        disabled={saved}
        className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 font-black tracking-widest transition-all duration-500 shadow-2xl transform ${
          saved 
            ? 'bg-emerald-500 text-white translate-y-[-4px] scale-[1.02]' 
            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white hover:scale-[1.05] hover:shadow-blue-500/40 active:scale-95'
        }`}
      >
        {saved ? (
          <>
            <div className="bg-white/20 p-1 rounded-full"><Check size={18} /></div>
            希望を送信しました
          </>
        ) : (
          <>
            <Save size={20} className="opacity-80" />
            希望を確定して送信
          </>
        )}
      </button>
    </div>
  );
};

export default StaffSubmit;
