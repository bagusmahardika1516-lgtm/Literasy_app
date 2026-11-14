import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthProvider.jsx';
import LoginScreen from './features/auth/LoginScreen.jsx';
import HomeScreen from './features/progress/HomeScreen.jsx';
import SectionScreen from './features/section/SectionScreen.jsx';

/** Halaman belajar: wajib masuk. Sesi berakhir (401) → otomatis ke halaman masuk. */
function RequireAuth({ children }) {
  const { student } = useAuth();
  return student ? children : <Navigate to="/masuk" replace />;
}

/** Halaman masuk hanya untuk yang belum masuk (mencegah data tercatat atas nama siswa lain). */
function GuestOnly({ children }) {
  const { student } = useAuth();
  return student ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomeScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/masuk"
            element={
              <GuestOnly>
                <LoginScreen />
              </GuestOnly>
            }
          />
          <Route
            path="/bagian/:sectionId"
            element={
              <RequireAuth>
                <SectionScreen />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
