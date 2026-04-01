import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShiftProvider } from './context/ShiftContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminView from './views/AdminView';
import StaffView from './views/StaffView';
import LoginView from './views/LoginView';
import SetupPasswordView from './views/SetupPasswordView';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loader
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Redirect based on hostname (Integrated with Auth)
const HomeRedirect = () => {
  const { user } = useAuth();
  const hostname = window.location.hostname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const isForcedAdmin = searchParams.get('mode') === 'admin';

  console.log("Current hostname:", hostname);
  console.log("Forced admin mode:", isForcedAdmin);

  // 'admin' という文字列が含まれているか、?mode=admin がある場合は管理者画面へ
  if (isForcedAdmin || hostname.includes('admin') || hostname.includes('localhost')) {
    return <Navigate to="/admin" replace />;
  }

  // スタッフ側のドメインでログインしていない場合はログイン画面へ
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to="/staff" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginView />} />
            <Route path="/setup" element={<SetupPasswordView />} />

            {/* Protected Application Routes */}
            <Route path="/" element={<HomeRedirect />} />
            {/* AdminView はスタッフ登録のために公開設定に変更 */}
            <Route path="/admin" element={<AdminView />} />
            <Route path="/staff" element={<ProtectedRoute><StaffView /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ShiftProvider>
    </AuthProvider>
  );
}

export default App;
