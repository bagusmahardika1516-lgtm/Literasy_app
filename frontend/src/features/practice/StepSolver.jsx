// Step Solver 6 langkah (F02; IL02, IL05, ADR-006): satu langkah aktif, langkah selesai menyusut jadi jejak.
import practice from '@content/practice.json';
import { useState } from 'react';
import { checkStep, SOLVER_STEPS } from '../../engine/practice.js';
import Button from '../../ui/Button.jsx';
import ChoiceList from '../../ui/ChoiceList.jsx';
import Feedback from '../../ui/Feedback.jsx';
import NumberInput from '../../ui/NumberInput.jsx';
import AnswerPanel from './AnswerPanel.jsx';
import styles from './StepSolver.module.css';

const T = practice.steps;

function summary(step, input) {
  if (step === 'asked') return practice.askedOptions.find((o) => o.value === input)?.label;
  if (step === 'given') return `r = ${input.r}, θ = ${input.theta}°`;
  if (step === 'formula') return practice.formulaOptions.find((o) => o.value === input)?.label;
  return input;
}

/** @param {{ problem: object, solved: boolean, onWrong: () => void,
 *   onAttempt: (r: object, answer: object) => void }} props */
export default function StepSolver({ problem, solved, onWrong, onAttempt }) {
  const [done, setDone] = useState({}); // step → input yang benar
  const [input, setInput] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const current = SOLVER_STEPS.find((s) => !(s in done));

  function check() {
    const r = checkStep(problem, current, input, T);
    if (r.correct) {
      setDone({ ...done, [current]: input });
      setInput(null);
      setFeedback(null);
    } else {
      setFeedback(r.feedback);
      onWrong();
    }
  }

  function goBack() {
    const prev = SOLVER_STEPS[SOLVER_STEPS.indexOf(current) - 1];
    if (!prev) return;
    const { [prev]: old, ...rest } = done;
    setDone(rest);
    setInput(old);
    setFeedback(null);
  }

  return (
    <div>
      <ol className={styles.trail}>
        {SOLVER_STEPS.filter((s) => s in done).map((s) => (
          <li key={s} className="num">
            {T[s].prompt.split(' ')[0]} {summary(s, done[s])} <span aria-label="benar">✓</span>
          </li>
        ))}
      </ol>

      {current && current !== 'compute' && (
        <section aria-label={T[current].prompt}>
          <h2 className={styles.prompt}>{T[current].prompt}</h2>
          {current === 'asked' && (
            <ChoiceList label={T.asked.prompt} options={practice.askedOptions} value={input} onChange={setInput} />
          )}
          {current === 'formula' && (
            <ChoiceList label={T.formula.prompt} options={practice.formulaOptions} value={input} onChange={setInput} />
          )}
          {current === 'given' && (
            <>
              <NumberInput label="Jari-jari (r)" value={input?.r ?? ''} onChange={(v) => setInput({ ...input, r: v })} />
              <NumberInput
                label="Sudut pusat (θ)"
                unitLabel="°"
                value={input?.theta ?? ''}
                onChange={(v) => setInput({ ...input, theta: v })}
              />
            </>
          )}
          {current === 'fraction' && (
            <NumberInput
              label={T.fraction.hint}
              value={input ?? ''}
              onChange={setInput}
              placeholder="1/4"
              inputMode="text"
            />
          )}
          {feedback && <Feedback correct={false}>{feedback}</Feedback>}
          <div className={styles.actions}>
            {current !== 'asked' && <Button onClick={goBack}>Kembali</Button>}
            <Button variant="primary" disabled={!input} onClick={check}>
              Cek langkah
            </Button>
          </div>
        </section>
      )}

      {current === 'compute' && (
        <section aria-label={T.compute.prompt}>
          <h2 className={styles.prompt}>{T.compute.prompt}</h2>
          <AnswerPanel problem={problem} solved={solved} label="Hasil" onAttempt={onAttempt} />
          {!solved && <Button onClick={goBack}>Kembali ke langkah rumus</Button>}
        </section>
      )}
    </div>
  );
}
