// Memilih layar sesuai `kind` bagian di content/sequence.json.
// Alur: kerjakan → hasil (skor per sesi, dicatat ke server) → skala usaha → beranda.
import sequence from '@content/sequence.json';
import { lazy, Suspense, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { markDone } from '../../data/profile.js';
import { recordResult } from '../../data/records.js';
import EffortRating from '../effort/EffortRating.jsx';
import { useProgress } from '../progress/useProgress.js';
import ResultScreen from '../result/ResultScreen.jsx';
import LockedScreen from './LockedScreen.jsx';

const SCREENS = {
  mltest: lazy(() => import('../mltest/MlTestScreen.jsx')),
  diagnostic: lazy(() => import('../diagnostic/DiagnosticScreen.jsx')),
  explore: lazy(() => import('../explore/ExploreScreen.jsx')),
  deck: lazy(() => import('../lesson/CardDeck.jsx')),
  contrast: lazy(() => import('../lesson/ContrastScreen.jsx')),
  game: lazy(() => import('../game/ArcOrSectorGame.jsx')),
  examples: lazy(() => import('../example/ExamplesScreen.jsx')),
  practice: lazy(() => import('../practice/PracticeScreen.jsx')),
  reflection: lazy(() => import('../reflection/ReflectionScreen.jsx')),
};

/**
 * Layar bagian memanggil onDone(hasil?) — hasil berupa { score, maxScore, details }.
 * Beberapa layar memasang onDone langsung ke onClick, jadi argumen lain (event) diabaikan.
 */
function toScore(raw) {
  if (raw && typeof raw === 'object' && 'maxScore' in raw && Number.isFinite(raw.maxScore) && raw.maxScore > 0) {
    return { score: raw.score, maxScore: raw.maxScore, details: raw.details ?? {} };
  }
  return { score: null, maxScore: null, details: raw?.details ?? {} };
}

/** Pindah ke bagian lain (mis. dari layar terkunci) = layar baru, bukan state bagian sebelumnya. */
export default function SectionScreen() {
  const { sectionId } = useParams();
  return <Section key={sectionId} sectionId={sectionId} />;
}

function Section({ sectionId }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('work'); // work → result → effort
  const [run, setRun] = useState(0); // naik saat "Ulangi bagian ini" → layar di-reset
  const [result, setResult] = useState(null);
  const startedAt = useRef(new Date().toISOString());
  const { progress, sync } = useProgress();
  // Akses yang sudah diberikan tidak dicabut lagi selama bagian ini terbuka (mis. saat mengulang)
  const grantedFor = useRef(null);
  const section = sequence.sections.find((s) => s.id === sectionId);
  if (!section) return <Navigate to="/" replace />;

  // Pembukaan bertahap: bagian terkunci tidak bisa dikerjakan, termasuk lewat URL langsung
  if (progress[section.id]?.unlocked) grantedFor.current = section.id;
  if (grantedFor.current !== section.id) {
    if (sync === 'loading') return <p role="status">Memeriksa bagian…</p>;
    const req = sequence.sections.find((s) => s.id === progress[section.id]?.requires) ?? null;
    return <LockedScreen section={section} requires={req} />;
  }

  const Screen = SCREENS[section.kind];
  const home = () => navigate('/');
  const isTest = section.kind === 'mltest';

  function finish(raw) {
    const s = toScore(raw);
    const completedAt = new Date().toISOString();
    markDone(section.id);
    // Uji Literasi sudah tersimpan & diskor di server lewat /api/mltest/submit
    const row = isTest
      ? null
      : recordResult({
          section_id: section.id,
          score: s.score,
          max_score: s.maxScore,
          details: s.details,
          started_at: startedAt.current,
          completed_at: completedAt,
        });
    setResult({ ...s, startedAt: startedAt.current, completedAt, recordId: row?.id, serverSaved: isTest });
    setPhase('result');
  }

  function retry() {
    startedAt.current = new Date().toISOString();
    setResult(null);
    setRun((n) => n + 1);
    setPhase('work');
  }

  if (phase === 'effort') return <EffortRating sectionId={section.id} onDone={home} />;
  if (phase === 'result') {
    return (
      <ResultScreen
        section={section}
        result={result}
        continueLabel={section.effortRating ? 'Lanjut →' : 'Kembali ke beranda'}
        onContinue={section.effortRating ? () => setPhase('effort') : home}
        onRetry={retry}
      />
    );
  }
  return (
    <Suspense fallback={<p>Memuat…</p>}>
      {/* key: membuka bagian lain / mengulang me-reset seluruh state layar */}
      <Screen key={`${section.id}-${run}`} section={section} onBack={home} onDone={finish} />
    </Suspense>
  );
}
