// Satu soal latihan. Bantuan menyesuaikan bagian (support):
//  guided      → gambar + Step Solver + petunjuk penuh (memudar)
//  independent → tanpa gambar, jawab langsung, petunjuk ≤ 1
//  literacy    → Tandai Info Penting dulu (formulate), lalu jawab + keputusan (interpret)
import practice from '@content/practice.json';
import { useRef, useState } from 'react';
import { recordAttempt } from '../../data/records.js';
import { availableHintLevels, supportsStepSolver } from '../../engine/practice.js';
import SvgSector from '../../scenes/svg/SvgSector.jsx';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ChoiceList from '../../ui/ChoiceList.jsx';
import Feedback from '../../ui/Feedback.jsx';
import SelfExplain from '../reflection/SelfExplain.jsx';
import AnswerPanel from './AnswerPanel.jsx';
import HighlightStem from './HighlightStem.jsx';
import HintBox from './HintBox.jsx';
import StepSolver from './StepSolver.jsx';

/**
 * @param {{ problem: object, sectionId: string, support: 'guided'|'independent'|'literacy',
 *   streakNoHint: number, onSolved: (s: { hintsUsed: number, firstTry: boolean }) => void }} props
 */
export default function ProblemView({ problem, sectionId, support, streakNoHint, onSolved }) {
  const [phase, setPhase] = useState(support === 'literacy' ? 'highlight' : 'answer');
  const [marked, setMarked] = useState([]);
  const [wrong, setWrong] = useState(0);
  const [hintsOpened, setHintsOpened] = useState(0);
  const [decision, setDecision] = useState(null);
  const started = useRef(Date.now());
  // Benar di percobaan pertama = tidak ada jawaban/langkah salah sebelum jawaban akhir benar
  const firstTry = useRef(null);

  const available = availableHintLevels({ support, streakNoHint, wrongOnCurrent: wrong });
  const useSolver = support === 'guided' && supportsStepSolver(problem);
  const solved = phase === 'decision' || phase === 'explain' || phase === 'done';

  function onAttempt(result, answer) {
    recordAttempt({
      problem_id: problem.id,
      section_id: sectionId,
      answer_value: String(answer.value).slice(0, 64),
      answer_unit: answer.unit,
      correct: result.correct,
      misconception_id: result.misconceptionId,
      hints_used: hintsOpened,
      duration_ms: Date.now() - started.current,
    });
    if (!result.correct) {
      setWrong((w) => w + 1);
      return;
    }
    if (firstTry.current === null) firstTry.current = wrong === 0;
    if (problem.decision) setPhase('decision');
    else if (problem.selfExplain) setPhase('explain');
    else setPhase('done');
  }

  function toggle(key) {
    setMarked((m) => (m.includes(key) ? m.filter((k) => k !== key) : [...m, key]));
  }

  const decisionOk = decision === problem.decision?.answer;

  return (
    <div>
      {support === 'guided' && 'r' in problem.model && (
        <div className={card.visual}>
          <SvgSector
            angle={problem.model.theta}
            radius={problem.model.r}
            highlight="none"
            unit={problem.answer.unit?.replace('2', '')}
          />
        </div>
      )}

      <div className={`${card.card} ${card.stem}`}>
        <HighlightStem stem={problem.stem} marked={marked} onToggle={phase === 'highlight' ? toggle : undefined} />
      </div>

      {phase === 'highlight' ? (
        <Button variant="primary" block onClick={() => setPhase('answer')}>
          Lanjut menjawab →
        </Button>
      ) : (
        <>
          {!solved && (
            <HintBox
              hints={problem.hints}
              available={available}
              opened={hintsOpened}
              onOpen={() => setHintsOpened((n) => n + 1)}
            />
          )}
          {useSolver ? (
            <StepSolver
              problem={problem}
              solved={solved}
              onWrong={() => setWrong((w) => w + 1)}
              onAttempt={onAttempt}
            />
          ) : (
            <AnswerPanel problem={problem} solved={solved} onAttempt={onAttempt} />
          )}
        </>
      )}

      {phase === 'decision' && (
        <section className={card.card}>
          <p>
            <strong>{practice.decisionLabel}</strong> {problem.decision.question}
          </p>
          <ChoiceList
            label={problem.decision.question}
            options={['ya', 'tidak']}
            value={decision}
            onChange={setDecision}
          />
          {decision && (
            <Feedback correct={decisionOk}>
              {decisionOk ? 'Keputusanmu tepat.' : 'Bandingkan lagi hasil hitunganmu dengan angka di soal.'}
            </Feedback>
          )}
          {decisionOk && (
            <Button variant="primary" block onClick={() => setPhase(problem.selfExplain ? 'explain' : 'done')}>
              Lanjut →
            </Button>
          )}
        </section>
      )}

      {phase === 'explain' && <SelfExplain promptId={problem.selfExplain} onDone={() => setPhase('done')} />}

      {phase === 'done' && (
        <Button
          variant="primary"
          block
          onClick={() => onSolved({ hintsUsed: hintsOpened, firstTry: firstTry.current === true })}
        >
          {practice.correctNext} →
        </Button>
      )}
    </div>
  );
}
