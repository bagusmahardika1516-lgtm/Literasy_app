import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MlTestScreen from './MlTestScreen.jsx';

const ITEMS = [
  {
    id: 'T9',
    title: 'Contoh',
    stem: ['Soal contoh.'],
    stages: [
      { id: 's1', prompt: 'Pilih', type: 'choice', choices: ['A', 'B'] },
      { id: 's2', prompt: 'Hitung', type: 'number', unit: 'cm' },
    ],
  },
];

vi.mock('../../api/client.js', () => ({
  getMlTest: vi.fn(async () => ({ items: ITEMS })),
  getMlTestStatus: vi.fn(async () => ({ pre_done: false, post_done: false })),
  submitMlTest: vi.fn(async () => ({ saved_items: 1 })),
}));
vi.mock('../../data/profile.js', () => ({ getProfile: () => ({ code: 'S01', classCode: 'DEMO' }) }));
const api = await import('../../api/client.js');

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Uji Literasi', () => {
  it('tanpa umpan balik, menyimpan draf, dan mengirim semua jawaban', async () => {
    const onDone = vi.fn();
    render(<MlTestScreen section={{ title: 'Uji Awal Literasi', testKind: 'pre' }} onBack={vi.fn()} onDone={onDone} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Mulai' }));

    fireEvent.click(screen.getByRole('radio', { name: 'B' }));
    expect(screen.queryByText(/Tepat|Belum tepat/)).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('literasy.mltest-draft')).answers.T9.s1).toBe('B');

    fireEvent.click(screen.getByRole('button', { name: /Lanjut/ }));
    fireEvent.change(screen.getByLabelText('Jawabanmu'), { target: { value: '22' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim semua jawaban' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [, , kind, answers] = api.submitMlTest.mock.calls[0];
    expect(kind).toBe('pre');
    expect(answers).toEqual({ T9: { s1: 'B', s2: '22' } });
    expect(localStorage.getItem('literasy.mltest-draft')).toBeNull();
  });

  it('tidak bisa mengulang uji yang sudah dikirim', async () => {
    api.getMlTestStatus.mockResolvedValueOnce({ pre_done: true, post_done: false });
    render(<MlTestScreen section={{ title: 'Uji Awal Literasi', testKind: 'pre' }} onBack={vi.fn()} onDone={vi.fn()} />);
    expect(await screen.findByText(/sudah mengerjakan/)).toBeInTheDocument();
  });
});
