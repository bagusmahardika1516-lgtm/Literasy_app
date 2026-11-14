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
}));
vi.mock('../../data/profile.js', () => ({ markDone: vi.fn() }));
const records = await import('../../data/records.js');

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

beforeEach(() => vi.clearAllMocks());

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
