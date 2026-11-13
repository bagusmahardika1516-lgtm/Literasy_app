import data from '@content/problems.json';
import practice from '@content/practice.json';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProblemView from './ProblemView.jsx';

vi.mock('../../data/records.js', () => ({
  recordAttempt: vi.fn(),
  recordReflection: vi.fn(),
  recordEffort: vi.fn(),
}));
const { recordAttempt } = await import('../../data/records.js');

const P = Object.fromEntries(data.problems.map((p) => [p.id, p]));
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));
const radio = (name) => fireEvent.click(screen.getByRole('radio', { name }));
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => vi.clearAllMocks());

describe('Latihan terbimbing (Step Solver) P01', () => {
  it('menuntun 5 langkah, cek kewajaran, lalu benar', () => {
    const onSolved = vi.fn();
    render(<ProblemView problem={P.P01} sectionId="guided" support="guided" streakNoHint={0} onSolved={onSolved} />);

    radio(/Panjang busur/);
    click('Cek langkah');
    type('Jari-jari (r)', '7');
    type('Sudut pusat (θ)', '90');
    click('Cek langkah');
    type(practice.steps.fraction.hint, '1/4');
    click('Cek langkah');
    radio('θ/360° × 2πr');
    click('Cek langkah');

    type('Hasil', '11');
    radio('cm');
    click('Cek jawaban');
    expect(screen.getByText(/Cek dulu sebelum kirim/)).toBeInTheDocument();
    expect(screen.getByText(/Keliling lingkaran = 44 cm/)).toBeInTheDocument();
    click('Ya, kirim');

    expect(screen.getByText(/Tepat/)).toBeInTheDocument();
    expect(recordAttempt).toHaveBeenCalledWith(expect.objectContaining({ problem_id: 'P01', correct: true }));
    // P01 punya prompt "Jelaskan ke Teman" (SE1)
    radio('Karena busur bagian dari keliling');
    click('Kirim penjelasan');
    click('Lanjut →');
    click(/Lanjut ke soal berikutnya/);
    expect(onSolved).toHaveBeenCalledWith({ hintsUsed: 0 });
  });

  it('memberi umpan balik khusus saat rumus tertukar (IL01)', () => {
    render(<ProblemView problem={P.P01} sectionId="guided" support="guided" streakNoHint={0} onSolved={vi.fn()} />);
    radio(/Panjang busur/);
    click('Cek langkah');
    type('Jari-jari (r)', '7');
    type('Sudut pusat (θ)', '90');
    click('Cek langkah');
    type(practice.steps.fraction.hint, '0,25');
    click('Cek langkah');
    radio('θ/360° × πr²');
    click('Cek langkah');
    expect(screen.getByText(practice.steps.formula.wrongArc)).toBeInTheDocument();
  });

  it('petunjuk dibuka bertahap dan tercatat', () => {
    render(<ProblemView problem={P.P02} sectionId="guided" support="guided" streakNoHint={0} onSolved={vi.fn()} />);
    click(/Petunjuk \(3\)/);
    expect(screen.getByText(P.P02.hints[0])).toBeInTheDocument();
    expect(screen.queryByText(P.P02.hints[1])).not.toBeInTheDocument();
    click(/Petunjuk \(2\)/);
    expect(screen.getByText(P.P02.hints[1])).toBeInTheDocument();
  });
});

describe('Latihan mandiri', () => {
  it('petunjuk dibatasi 1 dan satuan salah ditandai', () => {
    render(<ProblemView problem={P.P13} sectionId="independent" support="independent" streakNoHint={0} onSolved={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Petunjuk \(1\)/ })).toBeInTheDocument();
    type('Jawabanmu', '21');
    radio('cm²');
    click('Cek jawaban');
    expect(screen.getByText(/Yang ditanya panjang/)).toBeInTheDocument();
    radio('cm');
    click('Cek jawaban');
    expect(screen.getByText(/Tepat/)).toBeInTheDocument();
  });
});

describe('Soal literasi P15', () => {
  it('tandai info → hitung → ambil keputusan', () => {
    render(<ProblemView problem={P.P15} sectionId="literacy" support="literacy" streakNoHint={0} onSolved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '14' }));
    expect(screen.getByText(/Yang kamu tandai:/).parentElement).toHaveTextContent('14');
    click(/Lanjut menjawab/);
    type('Jawabanmu', '1.250.000');
    click('Cek jawaban');
    expect(screen.getByText(/Tepat/)).toBeInTheDocument();
    radio('ya');
    expect(screen.getByText(/Bandingkan lagi/)).toBeInTheDocument();
    radio('tidak');
    expect(screen.getByText(/Keputusanmu tepat/)).toBeInTheDocument();
  });
});
