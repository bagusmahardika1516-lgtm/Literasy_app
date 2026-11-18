import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SectionScreen from './SectionScreen.jsx';

vi.mock('../../data/records.js', () => ({
  recordResult: vi.fn(() => ({ id: 'r-1' })),
  recordEffort: vi.fn(),
  recordAttempt: vi.fn(),
  recordReflection: vi.fn(),
  flushNow: vi.fn(async () => true),
  isQueued: vi.fn(() => false),
  rejectionOf: vi.fn(() => null),
}));
vi.mock('../../data/profile.js', () => ({ markDone: vi.fn() }));
// Progres untuk pemeriksaan akses: default semua bagian terbuka
vi.mock('../progress/useProgress.js', () => ({ useProgress: vi.fn() }));
const records = await import('../../data/records.js');
const { useProgress } = await import('../progress/useProgress.js');

// Layar bagian palsu: menyelesaikan dengan skor tertentu
vi.mock('../game/ArcOrSectorGame.jsx', () => ({
  default: ({ onDone }) => (
    <button onClick={() => onDone({ score: 8, maxScore: 10, details: { missed: ['G1', 'G2'] } })}>Selesaikan</button>
  ),
}));
vi.mock('../lesson/ContrastScreen.jsx', () => ({
  default: ({ onDone }) => <button onClick={onDone}>Selesaikan</button>, // onDone menerima event klik
}));

function renderAt(id) {
  return render(
    <MemoryRouter initialEntries={[`/bagian/${id}`]}>
      <Routes>
        <Route path="/bagian/:sectionId" element={<SectionScreen />} />
        <Route path="/" element={<p>Beranda</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const allOpen = () => ({
  progress: new Proxy({}, { get: () => ({ unlocked: true, status: 'open' }) }),
  sync: 'ok',
});

beforeEach(() => {
  vi.clearAllMocks();
  useProgress.mockImplementation(allOpen);
  records.rejectionOf.mockReturnValue(null);
  records.isQueued.mockReturnValue(false);
});

const locked = (requires) => ({ unlocked: false, status: 'locked', requires });

describe('Pembukaan bertahap', () => {
  it('bagian terkunci lewat URL langsung: tidak bisa dikerjakan, ditunjukkan bagian yang harus selesai', async () => {
    useProgress.mockReturnValue({ progress: { game: locked('contrast') }, sync: 'ok' });
    renderAt('game');
    expect(screen.getByRole('heading', { name: 'Bagian ini masih terkunci' })).toBeInTheDocument();
    expect(screen.getByText('Bedakan Busur & Juring')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Selesaikan' })).not.toBeInTheDocument();
    expect(records.recordResult).not.toHaveBeenCalled();
  });

  it('menunggu progres dari server sebelum memutuskan terkunci', () => {
    useProgress.mockReturnValue({ progress: { game: locked('contrast') }, sync: 'loading' });
    renderAt('game');
    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa bagian');
  });

  it('dari layar terkunci bisa langsung membuka bagian yang disyaratkan', async () => {
    useProgress.mockReturnValue({
      progress: { game: locked('contrast'), contrast: { unlocked: true, status: 'open' } },
      sync: 'ok',
    });
    renderAt('game');
    fireEvent.click(screen.getByRole('button', { name: /Buka Bedakan Busur & Juring/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    expect(records.recordResult.mock.calls[0][0]).toMatchObject({ section_id: 'contrast' });
  });

  it('mengulang bagian yang sudah selesai tetap boleh', async () => {
    useProgress.mockReturnValue({ progress: { game: { unlocked: true, status: 'done', done: true } }, sync: 'ok' });
    renderAt('game');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi bagian ini' }));
    expect(await screen.findByRole('button', { name: 'Selesaikan' })).toBeInTheDocument();
  });

  it('hasil yang ditolak server ditampilkan sebagai belum tercatat', async () => {
    useProgress.mockReturnValue({ progress: { game: { unlocked: true, status: 'open' } }, sync: 'ok' });
    records.rejectionOf.mockReturnValue({ reason: 'incomplete', section_id: 'game', missing: ['G10'] });
    renderAt('game');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    await waitFor(() => expect(screen.getByText(/belum tercatat karena masih ada soal/)).toBeInTheDocument());
  });
});

describe('Hasil akhir bagian', () => {
  it('mencatat skor, menampilkan hasil + status tersimpan, lalu skala usaha', async () => {
    renderAt('game');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));

    const row = records.recordResult.mock.calls[0][0];
    expect(row).toMatchObject({ section_id: 'game', score: 8, max_score: 10, details: { missed: ['G1', 'G2'] } });
    expect(row.started_at <= row.completed_at).toBe(true);

    expect(screen.getByRole('img', { name: /8 dari 10/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Hasil tersimpan/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Lanjut →' }));
    expect(screen.getByText(/usaha pikiranmu/)).toBeInTheDocument();
  });

  it('bagian materi: tercatat selesai tanpa skor (event klik diabaikan)', async () => {
    renderAt('contrast');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    expect(records.recordResult.mock.calls[0][0]).toMatchObject({
      section_id: 'contrast',
      score: null,
      max_score: null,
    });
    expect(screen.getByRole('img', { name: 'Bagian selesai' })).toBeInTheDocument();
  });

  it('offline: status "belum tersambung"', async () => {
    records.isQueued.mockReturnValue(true);
    renderAt('game');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    await waitFor(() => expect(screen.getByText(/Belum tersambung/)).toBeInTheDocument());
  });

  it('Ulangi bagian ini → kembali ke layar bagian', async () => {
    records.isQueued.mockReturnValue(false);
    renderAt('game');
    fireEvent.click(await screen.findByRole('button', { name: 'Selesaikan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ulangi bagian ini' }));
    expect(await screen.findByRole('button', { name: 'Selesaikan' })).toBeInTheDocument();
  });
});
