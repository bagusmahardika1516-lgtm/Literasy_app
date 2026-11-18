// Cek prasyarat D1–D6 + remedial untuk butir yang salah (F03; IL03, K01).
import diag from '@content/diagnostic.json';
import practice from '@content/practice.json';
import { useState } from 'react';
import { checkAnswer } from '../../engine/checker.js';
import { evaluateDiagnostic } from '../../engine/practice.js';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ChoiceList from '../../ui/ChoiceList.jsx';
import Feedback from '../../ui/Feedback.jsx';
import NumberInput from '../../ui/NumberInput.jsx';
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import CardDeck from '../lesson/CardDeck.jsx';
import DiagnosticVisual from './DiagnosticVisual.jsx';

/** @param {{ section: { title: string }, onBack: () => void, onDone: () => void }} props */
export default function DiagnosticScreen({ section, onBack, onDone }) {
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [results, setResults] = useState({});
  const [answers, setAnswers] = useState({}); // {D1: jawaban} — server memeriksa semua butir terjawab
  const [phase, setPhase] = useState('quiz'); // quiz → summary → remedial
  const item = diag.items[i];

  function answer() {
    const ok = checkAnswer(item, value).correct;
    const next = { ...results, [item.id]: ok };
    setResults(next);
    setAnswers({ ...answers, [item.id]: String(value).slice(0, 32) });
    setValue('');
    if (i < diag.items.length - 1) setI(i + 1);
    else setPhase('summary');
  }

  function finish() {
    const r = evaluateDiagnostic(diag, results);
    onDone({
      score: r.score,
      maxScore: diag.items.length,
      details: { pass: r.pass, wrong: diag.items.filter((d) => !results[d.id]).map((d) => d.id), answers },
    });
  }

  function restart() {
    setI(0);
    setValue('');
    setResults({});
    setAnswers({});
    setPhase('quiz');
  }

  if (phase === 'remedial') {
    const { remedials } = evaluateDiagnostic(diag, results);
    return (
      <CardDeck cardIds={remedials} title="Mengingat kembali" onBack={() => setPhase('summary')} onDone={finish} />
    );
  }

  if (phase === 'summary') {
    const r = evaluateDiagnostic(diag, results);
    return (
      <main>
        <ScreenHeader title={section.title} onBack={onBack} onRestart={restart} />
        <Feedback correct={r.pass}>
          {r.score} dari {diag.items.length} benar.{' '}
          {r.pass ? 'Kamu siap lanjut.' : 'Yuk, ingat kembali beberapa hal dulu.'}
        </Feedback>
        {r.remedials.length > 0 && (
          <Button block onClick={() => setPhase('remedial')}>
            {r.pass ? 'Ulas bagian yang salah (pilihan)' : 'Mulai mengingat kembali →'}
          </Button>
        )}
        {r.pass && (
          <Button variant="primary" block onClick={finish} style={{ marginTop: 'var(--sp-3)' }}>
            Lanjut →
          </Button>
        )}
      </main>
    );
  }

  const unitLabel = item.answer.unit ? practice.units[item.answer.unit] : undefined;
  return (
    <main>
      <ScreenHeader
        title={section.title}
        progress={`${i + 1}/${diag.items.length}`}
        onBack={onBack}
        onRestart={restart}
      />
      <div className={card.card}>
        <DiagnosticVisual itemId={item.id} />
        <p style={{ margin: 'var(--sp-2) 0 0', fontWeight: 600, textAlign: 'center' }}>{item.prompt}</p>
      </div>
      {item.choices ? (
        <ChoiceList label={item.prompt} options={item.choices} value={value} onChange={setValue} />
      ) : (
        <NumberInput label="Jawabanmu" value={value} onChange={setValue} unitLabel={unitLabel} />
      )}
      <Button variant="primary" block disabled={!value} onClick={answer}>
        Jawab
      </Button>
    </main>
  );
}
