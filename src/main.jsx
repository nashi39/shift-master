import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // グローバルスタイルのインポート
import App from './App.jsx' // メインのアプリケーションコンポーネント

/**
 * アプリケーションのエントリーポイント
 * 
 * HTMLファイル内の <div id="root"></div> に対して、
 * Reactアプリケーションをレンダリング（描画）します。
 * 
 * StrictMode: 開発中に潜在的な問題を検知するためのラッパーです。
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
