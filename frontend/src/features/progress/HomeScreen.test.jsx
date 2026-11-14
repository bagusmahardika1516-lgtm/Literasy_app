import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeScreen from './HomeScreen.jsx';

const logout = vi.fn(async () => {});
vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({ student: { code: 'S01', classCode: 'K', username: 'k-s01' }, logout }),
}));
vi.mock('./UpdatePrompt.jsx', () => ({ default: () => null }));
vi.mock('../../api/client.js', () => ({ getProgress: vi.fn() }));
vi.mock('../../data/records.js', () => ({
  flush: vi.fn(async () => {}),
  pendingCount: vi.fn(() => 0),
  queuedResults: vi.fn(() => []),
}));
vi.mock('../../data/profile.js', () => ({
  getProgress: () => ({}),
  studentKey: (base) => `${base}.S01`,
}));
const api = await import('../../api/client.js');
const records = await import('../../data/records.js');

const row = (id, extra = {}) => ({ section_id: id, done: false, times_completed: 0, last: null, best: null, ...extra });

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  records.pendingCount.mockReturnValue(0);
});

function renderHome() {
  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>,
  );
}

describe('Beranda', () => {
  it('menampilkan progres & skor dari server', async () => {
    api.getProgress.mockResolvedValue({
      sections: [
        row('pretest', { done: true, times_completed: 1, last: { score: 10, max_score: 24 } }),
        row('diagnostic', { done: true, times_completed: 1, last: { score: 5, max_score: 6 } }),
      ],
    });
    renderHome();
    await waitFor(() => expect(screen.getByRole('img', { name: /2 dari 12 bagian/ })).toBeInTheDocument());
    const diag = screen.getByRole('link', { name: /Cek Prasyarat/ });
    expect(within(diag).getByText('5/6')).toBeInTheDocument();
    const uji = screen.getByRole('region', { name: 'Uji Literasi' });
    expect(within(uji).getByText('10/24')).toBeInTheDocument();
    expect(within(uji).getByText('Belum dikerjakan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Eksplorasi/ })).toHaveAttribute('aria-current', 'step');
  });

  it('offline: memakai cache terakhir dan memberi tahu', async () => {
    localStorage.setItem(
      'literasy.progress-cache.S01',
      JSON.stringify({ sections: [row('pretest', { done: true, last: { score: 7, max_score: 24 } })] }),
    );
    api.getProgress.mockRejectedValue(new Error('offline'));
    renderHome();
    expect(await screen.findByText(/Belum tersambung ke server/)).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Uji Literasi' })).getByText('7/24')).toBeInTheDocument();
  });

  it('keluar dengan catatan tertunda → dialog konfirmasi, batal tidak keluar', async () => {
    api.getProgress.mockResolvedValue({ sections: [] });
    records.pendingCount.mockReturnValue(3);
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Keluar sekarang?' });
    expect(within(dialog).getByText('3')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Jangan keluar dulu' })).toHaveFocus();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Jangan keluar dulu' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Tetap keluar' }));
    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it('keluar tanpa catatan tertunda → langsung keluar', async () => {
    api.getProgress.mockResolvedValue({ sections: [] });
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(records.flush).toHaveBeenCalled();
  });
});
