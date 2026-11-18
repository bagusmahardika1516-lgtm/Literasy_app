// "Sudah dijawab" untuk tahap Uji Literasi — aturan yang sama dengan backend/app/engine/mltest.py
// (stage_answered). Hanya memeriksa terisi, bukan benar/salah; tidak memengaruhi skor.

export function isFilled(v) {
  if (v === null || v === undefined || typeof v === 'boolean') return false;
  return (typeof v === 'string' || typeof v === 'number') && String(v).trim() !== '';
}

/** @param {{ type: string, choices?: string[], fields?: { id: string }[] }} stage */
export function stageAnswered(stage, value) {
  if (stage.type === 'choice') return typeof value === 'string' && (stage.choices ?? []).includes(value);
  if (stage.type === 'fields') {
    return Boolean(value) && typeof value === 'object' && (stage.fields ?? []).every((f) => isFilled(value[f.id]));
  }
  return isFilled(value); // number, text
}

/**
 * Posisi tahap yang belum dijawab, urut dari soal pertama.
 * @returns {{ pos: [number, number], label: string }[]}
 */
export function missingStages(items, answers) {
  const out = [];
  items.forEach((item, ii) => {
    item.stages.forEach((stage, si) => {
      if (!stageAnswered(stage, answers?.[item.id]?.[stage.id])) {
        out.push({ pos: [ii, si], label: `Soal ${ii + 1} langkah ${si + 1}` });
      }
    });
  });
  return out;
}
