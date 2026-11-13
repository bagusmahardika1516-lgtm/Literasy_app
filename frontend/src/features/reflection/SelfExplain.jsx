// "Jelaskan ke Teman" (F11, GL04): pilihan alasan atau isian bebas.
import reflections from '@content/reflections.json';
import { useState } from 'react';
import { recordReflection } from '../../data/records.js';
import Button from '../../ui/Button.jsx';
import card from '../../ui/Card.module.css';
import ChoiceList from '../../ui/ChoiceList.jsx';
import Feedback from '../../ui/Feedback.jsx';
import styles from './SelfExplain.module.css';

const MAX_TEXT = 300;

/** @param {{ promptId: string, onDone: () => void }} props */
export default function SelfExplain({ promptId, onDone }) {
  const p = reflections.prompts[promptId];
  const [choice, setChoice] = useState(null);
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const picked = p.choices?.find((c) => c.text === choice);

  function submit() {
    if (p.freeText) {
      recordReflection({ prompt_id: promptId, free_text: text.trim() }); // dinilai peneliti dengan rubrik 0–2
      onDone();
      return;
    }
    recordReflection({ prompt_id: promptId, choice, score: picked.correct ? 2 : 0 });
    setChecked(true);
  }

  return (
    <section className={card.card} aria-label="Jelaskan ke teman">
      <p className={styles.question}>{p.question}</p>
      {p.freeText ? (
        <textarea
          className={styles.text}
          rows={4}
          maxLength={MAX_TEXT}
          value={text}
          aria-label={p.question}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <ChoiceList
          label={p.question}
          options={p.choices.map((c) => c.text)}
          value={choice}
          onChange={setChoice}
          disabled={checked}
          status={checked ? { [choice]: picked.correct ? 'correct' : 'wrong' } : {}}
        />
      )}
      {checked && (
        <Feedback correct={picked.correct}>
          {picked.correct ? 'Penjelasanmu tepat.' : `Alasan yang tepat: ${p.choices.find((c) => c.correct).text}.`}
        </Feedback>
      )}
      {checked ? (
        <Button variant="primary" block onClick={onDone}>
          Lanjut →
        </Button>
      ) : (
        <Button variant="primary" block disabled={p.freeText ? text.trim().length < 3 : !choice} onClick={submit}>
          Kirim penjelasan
        </Button>
      )}
    </section>
  );
}
