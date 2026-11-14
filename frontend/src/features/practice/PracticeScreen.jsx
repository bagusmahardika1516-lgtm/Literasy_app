// Latihan soal per bagian (guided / independent / literacy) — content/sequence.json.
import data from '@content/problems.json';
import { useState } from 'react';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import ProblemView from './ProblemView.jsx';

const BY_ID = Object.fromEntries(data.problems.map((p) => [p.id, p]));

/** @param {{ section: { id: string, title: string, support: string, items: string[] },
 *   onBack: () => void, onDone: () => void }} props */
export default function PracticeScreen({ section, onBack, onDone }) {
  const [i, setI] = useState(0);
  const [streakNoHint, setStreak] = useState(0); // untuk pemudaran petunjuk (F10)
  const [attemptKey, setAttemptKey] = useState(0);
  const [items, setItems] = useState({}); // {P01: { first_try, hints }} — skor bagian
  const problem = BY_ID[section.items[i]];

  function solved({ hintsUsed, firstTry }) {
    setStreak((s) => (hintsUsed === 0 ? s + 1 : 0));
    const next = { ...items, [problem.id]: { first_try: Boolean(firstTry), hints: hintsUsed } };
    setItems(next);
    if (i < section.items.length - 1) {
      setI(i + 1);
      return;
    }
    const rows = Object.values(next);
    onDone({
      score: rows.filter((r) => r.first_try).length,
      maxScore: section.items.length,
      details: { hints: rows.reduce((n, r) => n + r.hints, 0), items: next },
    });
  }

  return (
    <main>
      <ScreenHeader
        title={section.title}
        progress={`Soal ${i + 1}/${section.items.length}`}
        onBack={i === 0 ? onBack : () => setI(i - 1)}
        onRestart={() => setAttemptKey((k) => k + 1)}
      />
      <ProblemView
        key={`${problem.id}-${attemptKey}`}
        problem={problem}
        sectionId={section.id}
        support={section.support}
        streakNoHint={streakNoHint}
        onSolved={solved}
      />
    </main>
  );
}
