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
  const problem = BY_ID[section.items[i]];

  function solved({ hintsUsed }) {
    setStreak((s) => (hintsUsed === 0 ? s + 1 : 0));
    if (i === section.items.length - 1) onDone();
    else setI(i + 1);
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
