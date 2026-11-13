// Memilih layar sesuai `kind` bagian di content/sequence.json, lalu skala usaha → tandai selesai → beranda.
import sequence from '@content/sequence.json';
import { lazy, Suspense, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { markDone } from '../../data/profile.js';
import EffortRating from '../effort/EffortRating.jsx';

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

export default function SectionScreen() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('work');
  const section = sequence.sections.find((s) => s.id === sectionId);
  if (!section) return <Navigate to="/" replace />;

  const Screen = SCREENS[section.kind];
  const home = () => navigate('/');

  function finish() {
    markDone(section.id);
    if (section.effortRating) setPhase('effort');
    else home();
  }

  if (phase === 'effort') return <EffortRating sectionId={section.id} onDone={home} />;
  return (
    <Suspense fallback={<p>Memuat…</p>}>
      {/* key: membuka bagian lain me-reset seluruh state layar */}
      <Screen key={section.id} section={section} onBack={home} onDone={finish} />
    </Suspense>
  );
}
