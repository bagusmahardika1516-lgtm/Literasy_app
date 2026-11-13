// Satu tahap Uji Literasi: pilihan, angka, beberapa isian (diketahui), atau teks alasan.
import ChoiceList from '../../ui/ChoiceList.jsx';
import NumberInput from '../../ui/NumberInput.jsx';
import styles from '../reflection/SelfExplain.module.css';

/** @param {{ stage: { type: string, prompt: string, choices?: string[], unit?: string,
 *   fields?: { id: string, label: string, unit: string }[] }, value: any, onChange: (v: any) => void }} props */
export default function MlStage({ stage, value, onChange }) {
  return (
    <section aria-label={stage.prompt}>
      <h2>{stage.prompt}</h2>
      {stage.type === 'choice' && (
        <ChoiceList label={stage.prompt} options={stage.choices} value={value} onChange={onChange} />
      )}
      {stage.type === 'number' && (
        <NumberInput label="Jawabanmu" value={value ?? ''} onChange={onChange} unitLabel={stage.unit} />
      )}
      {stage.type === 'fields' &&
        stage.fields.map((f) => (
          <NumberInput
            key={f.id}
            label={f.label}
            unitLabel={f.unit}
            value={value?.[f.id] ?? ''}
            onChange={(v) => onChange({ ...value, [f.id]: v })}
          />
        ))}
      {stage.type === 'text' && (
        <textarea
          className={styles.text}
          rows={4}
          maxLength={500}
          aria-label={stage.prompt}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </section>
  );
}
