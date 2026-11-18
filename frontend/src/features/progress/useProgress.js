// Progres semua bagian untuk beranda dan pemeriksaan akses bagian (pembukaan bertahap).
// Tampil langsung dari cache + antrean di HP, lalu diperbarui dari server (GET /api/progress).
import sequence from '@content/sequence.json';
import { useEffect, useState } from 'react';
import { getProgress } from '../../api/client.js';
import { localProgress, writeCache } from '../../data/progress.js';
import { flush } from '../../data/records.js';

export const SECTION_IDS = sequence.sections.map((s) => s.id);

/** @returns {{ progress: Record<string, import('../../data/progress.js').SectionProgress>,
 *   sync: 'loading' | 'ok' | 'offline' }} */
export function useProgress() {
  const [progress, setProgress] = useState(() => localProgress(SECTION_IDS));
  const [sync, setSync] = useState('loading');

  useEffect(() => {
    let alive = true;
    // kirim dulu yang tertunda agar server punya data terbaru, lalu baca progres
    flush()
      .then(() => getProgress())
      .then((res) => {
        writeCache(res.sections);
        if (alive) setSync('ok');
      })
      .catch(() => alive && setSync('offline'))
      .finally(() => alive && setProgress(localProgress(SECTION_IDS)));
    return () => {
      alive = false;
    };
  }, []);
  return { progress, sync };
}
