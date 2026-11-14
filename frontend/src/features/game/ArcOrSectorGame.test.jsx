import game from '@content/game.json';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ArcOrSectorGame from './ArcOrSectorGame.jsx';

const LABEL = { arc: 'Busur', sector: 'Juring' };
const WRONG = { arc: 'Juring', sector: 'Busur' };

describe('Permainan Busur atau Juring?', () => {
  it('kartu salah diulang, selesai setelah semua tepat', () => {
    const onDone = vi.fn();
    render(<ArcOrSectorGame section={{ title: 'Permainan' }} onBack={vi.fn()} onDone={onDone} />);

    // kartu pertama dijawab salah → muncul lagi di akhir
    fireEvent.click(screen.getByRole('button', { name: WRONG[game.items[0].answer] }));
    expect(screen.getByText(/Belum tepat/)).toBeInTheDocument();
    expect(screen.getByText(game.items[0].why, { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Kartu berikutnya/ }));

    const order = [...game.items.slice(1), game.items[0]];
    for (const item of order) {
      expect(screen.getByText(item.text)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: LABEL[item.answer] }));
      fireEvent.click(screen.getByRole('button', { name: /Kartu berikutnya/ }));
    }
    expect(screen.getByText(/Semua kartu sudah tepat/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
    // skor = kartu yang tepat pada pilihan pertama
    expect(onDone).toHaveBeenCalledWith({
      score: game.items.length - 1,
      maxScore: game.items.length,
      details: { missed: [game.items[0].id] },
    });
  });
});
