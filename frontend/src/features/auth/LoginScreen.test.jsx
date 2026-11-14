import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, UNAUTHORIZED_EVENT } from '../../api/client.js';
import { getSession, saveSession } from '../../data/session.js';
import { AuthProvider, useAuth } from './AuthProvider.jsx';
import LoginScreen from './LoginScreen.jsx';

vi.mock('../../api/client.js', async (orig) => ({
  ...(await orig()),
  login: vi.fn(),
  logout: vi.fn(async () => null),
  me: vi.fn(async () => ({ code: 'S01', class_code: '8A-2026', username: '8a-2026-s01' })),
  postRecords: vi.fn(async () => ({ inserted: 0 })),
}));
const api = await import('../../api/client.js');

function Home() {
  const { student, logout } = useAuth();
  return (
    <div>
      <p>Beranda {student.code}</p>
      <button onClick={logout}>Keluar</button>
    </div>
  );
}

function renderApp(path = '/masuk') {
  function Guard({ children, guest }) {
    const { student } = useAuth();
    if (guest) return student ? <Navigate to="/" replace /> : children;
    return student ? children : <Navigate to="/masuk" replace />;
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Guard>{<Home />}</Guard>} />
          <Route path="/masuk" element={<Guard guest>{<LoginScreen />}</Guard>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

const SESSION = {
  token: 'tok-lama',
  expiresAt: '2026-12-31T00:00:00Z',
  student: { code: 'S01', classCode: '8A-2026', username: '8a-2026-s01' },
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function fill(username, password) {
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
}

describe('Halaman masuk', () => {
  it('masuk dengan username + password, menyimpan token, lalu ke beranda', async () => {
    api.login.mockResolvedValueOnce({
      token: 'tok-baru',
      expires_at: '2026-12-31T00:00:00Z',
      student: { code: 'S01', class_code: '8A-2026', username: '8a-2026-s01' },
    });
    renderApp();
    fill('  8A-2026-S01 ', 'rahasia');
    expect(await screen.findByText('Beranda S01')).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith('8a-2026-s01', 'rahasia');
    expect(getSession().token).toBe('tok-baru');
  });

  it('menampilkan pesan dan mengosongkan password bila salah', async () => {
    api.login.mockRejectedValueOnce(new ApiError('Username atau password salah.', 401, 'invalid_credentials'));
    renderApp();
    fill('8a-2026-s01', 'salah');
    expect(await screen.findByRole('alert')).toHaveTextContent('Username atau password salah.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(getSession()).toBeNull();
  });

  it('tombol Lihat menampilkan password', () => {
    renderApp();
    const pw = screen.getByLabelText('Password');
    expect(pw).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat' }));
    expect(pw).toHaveAttribute('type', 'text');
  });

  it('sudah masuk → /masuk dialihkan ke beranda (tidak bisa masuk sebagai siswa lain)', () => {
    saveSession(SESSION);
    renderApp('/masuk');
    expect(screen.getByText('Beranda S01')).toBeInTheDocument();
  });

  it('tetap masuk setelah aplikasi dibuka ulang (sesi dari localStorage)', async () => {
    saveSession(SESSION);
    renderApp('/');
    expect(screen.getByText('Beranda S01')).toBeInTheDocument();
    await waitFor(() => expect(api.me).toHaveBeenCalled());
  });

  it('401 dari server → keluar dan menampilkan alasan di halaman masuk', async () => {
    saveSession(SESSION);
    renderApp('/');
    act(() => {
      localStorage.removeItem('literasy.session');
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { code: 'session_replaced' } }));
    });
    expect(await screen.findByRole('status')).toHaveTextContent('masuk di perangkat lain');
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('Keluar mencabut sesi di server dan menghapus token', async () => {
    saveSession(SESSION);
    renderApp('/');
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    expect(await screen.findByLabelText('Username')).toBeInTheDocument();
    expect(api.logout).toHaveBeenCalled();
    expect(getSession()).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
