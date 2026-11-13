import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getProfile } from './data/profile.js';
import { flush } from './data/records.js';
import LoginScreen from './features/auth/LoginScreen.jsx';
import HomeScreen from './features/progress/HomeScreen.jsx';
import SectionScreen from './features/section/SectionScreen.jsx';
import WelcomeScreen from './features/welcome/WelcomeScreen.jsx';

function RequireProfile({ children }) {
  return getProfile() ? children : <Navigate to="/" replace />;
}

/** Belum masuk → Halaman awal; sudah masuk → Beranda. */
function Start() {
  return getProfile() ? <HomeScreen /> : <WelcomeScreen />;
}

export default function App() {
  useEffect(() => {
    flush(); // kirim catatan yang tertunda dari sesi sebelumnya
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/masuk" element={<LoginScreen />} />
        <Route
          path="/bagian/:sectionId"
          element={
            <RequireProfile>
              <SectionScreen />
            </RequireProfile>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
