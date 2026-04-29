import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShiftProvider } from './context/ShiftContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminView from './views/AdminView';
import StaffView from './views/StaffView/index';
import LoginView from './views/LoginView';
import SetupPasswordView from './views/SetUpPasswordView';

/**
 * ProtectedRoute (保護されたルート)
 * 
 * 【役割】
 * ログインしていないユーザーがアクセスしようとした場合、強制的にログイン画面へリダイレクトさせます。
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 認証状態の確認中（通信中）は何も表示しない
  if (loading) return null; 
  
  // 未ログインならログインページへ
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

/**
 * AdminRoute (管理者専用ルート)
 * 
 * 【役割】
 * ログイン済み、かつロールが「admin」であるユーザーのみアクセスを許可します。
 * それ以外はログイン画面へリダイレクトさせます。
 */
const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user || userData?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * Home (ルートパス "/" の表示切り替え)
 * 
 * 【役割】
 * ログイン直後のトップページにおいて、ユーザーのロールに応じた画面を出し分けます。
 * - 管理者(admin)の場合: AdminView を表示
 * - スタッフ(staff)の場合: StaffView を表示
 */
const Home = () => {
  const { userData, loading } = useAuth();
  
  if (loading) return null;
  
  // ロールに基づいてViewを切り替え
  if (userData?.role === 'admin') return <AdminView />;
  return <StaffView />;
};

/**
 * App (アプリケーション本体)
 * 
 * 【構造】
 * 1. AuthProvider: 認証状態（Firebase Auth）をアプリ全体で共有
 * 2. ShiftProvider: シフトデータやスタッフ一覧をアプリ全体で共有
 * 3. Router: URLパスに基づいた画面遷移（ルーティング）を制御
 */
function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <Router>
          <Routes>
            {/* 認証不要なルート */}
            <Route path="/login" element={<LoginView />} />
            <Route path="/setup" element={<SetupPasswordView />} />
            
            {/* 認証が必要なトップページ（ロールにより分岐） */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            {/* 明示的な管理者ページへのパス */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminView />
                </AdminRoute>
              } 
            />
            
            {/* 定義されていないパス（404等）はトップページへリダイレクト */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ShiftProvider>
    </AuthProvider>
  );
}

export default App;
