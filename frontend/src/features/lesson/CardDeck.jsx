// Kumpulan kartu konsep, satu kartu per layar, tempo diatur siswa (F08, EL04).
import lessons from '@content/lessons.json';
import { useState } from 'react';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import ConceptCard from './ConceptCard.jsx';

/**
 * @param {{ section?: { title: string, deck: string }, cardIds?: string[], title?: string,
 *   onBack: () => void, onDone: () => void }} props
 */
export default function CardDeck({ section, cardIds, title, onBack, onDone }) {
  const ids = cardIds ?? lessons.decks[section.deck];
  const [i, setI] = useState(0);
  const last = i === ids.length - 1;

  return (
    <main>
      <ScreenHeader
        title={title ?? section.title}
        progress={`${i + 1}/${ids.length}`}
        onBack={i === 0 ? onBack : () => setI(i - 1)}
        onRestart={() => setI(0)}
      />
      <ConceptCard data={lessons.cards[ids[i]]} />
      <div className={card.actions}>
        {i > 0 && <Button onClick={() => setI(i - 1)}>Kembali</Button>}
        <Button variant="primary" onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Selesai' : 'Lanjut →'}
        </Button>
      </div>
    </main>
  );
}
