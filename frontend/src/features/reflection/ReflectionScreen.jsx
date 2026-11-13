// Refleksi akhir modul (SE5): siswa menulis beda busur dan juring dengan kata-katanya sendiri.
import ScreenHeader from '../../ui/ScreenHeader.jsx';
import SelfExplain from './SelfExplain.jsx';

/** @param {{ section: { title: string, prompt: string }, onBack: () => void, onDone: () => void }} props */
export default function ReflectionScreen({ section, onBack, onDone }) {
  return (
    <main>
      <ScreenHeader title={section.title} onBack={onBack} />
      <SelfExplain promptId={section.prompt} onDone={onDone} />
    </main>
  );
}
