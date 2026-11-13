// Isian jawaban akhir: angka + pilihan satuan, atau pilihan ganda; Cek Kewajaran sebelum kirim (F09, GL02).
import practice from '@content/practice.json';
import { useState } from 'react';
import { checkAnswer } from '../../engine/checker.js';
import { sanityInfo, unitChoices } from '../../engine/practice.js';
import Button from '../../ui/Button.jsx';
import ChoiceList from '../../ui/ChoiceList.jsx';
import Feedback from '../../ui/Feedback.jsx';
import NumberInput from '../../ui/NumberInput.jsx';
import SanityCheck from './SanityCheck.jsx';

const U = practice.units;

/**
 * @param {{ problem: object, label?: string, solved: boolean,
 *   onAttempt: (result: { correct: boolean, feedback: string, misconceptionId?: string },
 *     answer: { value: string, unit?: string }) => void }} props
 */
export default function AnswerPanel({ problem, label = 'Jawabanmu', solved, onAttempt }) {
  const isChoice = Array.isArray(problem.choices);
  const units = unitChoices(problem.answer.unit);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState(units.length ? undefined : problem.answer.unit);
  const [phase, setPhase] = useState('input'); // input → sanity → result
  const [result, setResult] = useState(null);
  const sanity = sanityInfo(problem);

  function submit() {
    if (sanity && phase === 'input') {
      setPhase('sanity');
      return;
    }
    const r = checkAnswer(problem, value, isChoice ? undefined : unit);
    setResult(r);
    setPhase('result');
    onAttempt(r, { value, unit });
  }

  function edit(v) {
    setValue(v);
    if (phase === 'result') setPhase('input');
  }

  const ready = isChoice ? Boolean(value) : value.trim() !== '' && (units.length === 0 || Boolean(unit));

  return (
    <div>
      {isChoice ? (
        <ChoiceList label={label} options={problem.choices} value={value} onChange={edit} disabled={solved} />
      ) : (
        <NumberInput
          label={label}
          value={value}
          onChange={edit}
          disabled={solved}
          units={units.map((u) => ({ value: u, label: U[u] }))}
          unit={unit}
          onUnitChange={(u) => {
            setUnit(u);
            if (phase === 'result') setPhase('input');
          }}
          unitLabel={units.length ? undefined : U[problem.answer.unit]}
        />
      )}

      {phase === 'sanity' && (
        <SanityCheck
          info={sanity}
          answer={value}
          answerUnit={unit ? U[unit] : ''}
          onSend={submit}
          onRecheck={() => setPhase('input')}
        />
      )}

      {phase === 'result' && result && <Feedback correct={result.correct}>{result.feedback}</Feedback>}

      {!solved && phase !== 'sanity' && (
        <Button variant="primary" block disabled={!ready || phase === 'result'} onClick={submit}>
          Cek jawaban
        </Button>
      )}
    </div>
  );
}
