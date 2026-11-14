# API — Skema Konten, Engine, Scene, dan Supabase

Dokumen ini menjadi kontrak antar-modul ([architecture.md](architecture.md)). Nama tabel dan tipe di sini adalah
acuan tunggal.

## 1. Skema konten (JSON)

### 1.1 Tipe dasar (TypeScript)

```ts
// src/engine/types.ts
export type Unit = 'cm' | 'cm2' | 'm' | 'm2' | 'deg';
export type PiMode = '22/7' | '3.14';
export type Level = 'L1' | 'L2' | 'L3' | 'L4';
export type MlProcess = 'formulate' | 'employ' | 'interpret';
export type ClTag = `K0${number}` | `IL0${number}` | `EL0${number}` | `GL0${number}` | `DS0${number}`;
export type Context = 'personal' | 'occupational' | 'societal' | 'scientific' | null;
export type SceneId = 'circleSector' | 'sectorLift' | 'arcUnroll'
  | 'pizza' | 'clock' | 'fan' | 'park' | 'ferrisWheel' | 'sprinkler' | 'cake';
export type Asked = 'arcLength' | 'sectorArea' | 'sectorPerimeter' | 'theta' | 'radius' | 'compare' | 'evaluate';
export type StepId = 'asked' | 'given' | 'fraction' | 'formula' | 'compute' | 'check';

export interface Answer {
  value: number | string;     // string untuk jawaban pilihan/evaluasi (mis. "A")
  unit?: Unit;
  tolerance?: number;          // relatif, default 0.01
}

export interface Misconception {
  answer: number | string;
  id?: string;                 // mis. "swap_formula", "forgot_fraction", "diameter_as_radius"
  feedback: string;
}

export interface Problem {
  id: string;                  // "P01".."P18"
  level: Level;
  mlProcess: MlProcess[];
  clTags: ClTag[];
  context: Context;
  scene?: SceneId;
  stem: string[];              // satu kalimat per elemen (F05)
  given: Record<string, number>;
  asked: Asked;
  answer: Answer;
  pi: PiMode;
  steps: StepId[];             // urutan Step Solver
  hints: [string, string, string];
  misconceptions?: Misconception[];
  selfExplain?: string;        // id prompt SE
}

export interface ConceptCard {
  id: string;                  // "C1".."C6", "R-Keliling"
  title: string;
  body: string;                // ≤ 40 kata — divalidasi saat build
  formula?: string;            // LaTeX
  visual: { kind: 'svg' | 'scene'; ref: string; params?: Record<string, number> };
  clTags: ClTag[];
}

export interface WorkedExample {
  id: string;                  // "WE1".."WE6"
  stem: string[];
  steps: { step: StepId; text: string; formula?: string }[];
  selfExplain?: string;
  scene?: SceneId;
}

export interface DiagnosticItem {
  id: string;                  // "D1".."D6"
  prompt: string;
  choices?: string[];
  answer: Answer;
  remedial: string;            // id ConceptCard remedial
}

export interface SelfExplainPrompt {
  id: string;                  // "SE1".."SE5"
  question: string;
  choices?: { text: string; correct: boolean }[];
  freeText?: boolean;
}

export interface SequenceSection {
  id: string;                  // "explore", "concept", "guided-1", ...
  title: string;
  items: string[];             // id konten
  support: 'full' | 'guided' | 'independent' | 'literacy';
  effortRating: boolean;       // tampilkan skala Paas di akhir
}
```

### 1.2 Validasi konten (skrip build)

`npm run content:check` memeriksa:
- semua `id` unik; referensi `selfExplain`, `remedial`, `scene` ada;
- `body` kartu ≤ 40 kata; `stem` setiap kalimat ≤ 20 kata;
- `answer.value` cocok dengan hasil `engine/math.ts` dari `given` (mencegah salah kunci);
- tepat 3 petunjuk; petunjuk ke-3 tidak memuat `answer.value`.

## 2. API Learning Engine

```ts
// engine/math.ts
export function pickPi(r: number): PiMode;                                // kelipatan 7 → '22/7'
export function piValue(mode: PiMode): number;
export function fraction(theta: number): number;                          // theta / 360
export function arcLength(r: number, theta: number, pi?: PiMode): number;
export function sectorArea(r: number, theta: number, pi?: PiMode): number;
export function sectorPerimeter(r: number, theta: number, pi?: PiMode): number; // 2r + busur
export function thetaFromArc(arc: number, r: number, pi?: PiMode): number;
export function thetaFromArea(area: number, r: number, pi?: PiMode): number;
export function radiusFromArc(arc: number, theta: number, pi?: PiMode): number;
export function radiusFromArea(area: number, theta: number, pi?: PiMode): number;
export function round2(x: number): number;

// engine/checker.ts
export interface CheckResult {
  correct: boolean;
  unitOk: boolean;
  misconceptionId?: string;
  feedback: string;
}
export function parseNumber(input: string): number | null;   // terima "7,33" dan "7.33"
export function checkAnswer(p: Problem, value: string, unit?: Unit): CheckResult;
export function checkStep(p: Problem, step: StepId, input: unknown): CheckResult;

// engine/stepSolver.ts
export interface SolverState {
  problemId: string;
  current: StepId | 'done';
  completed: Partial<Record<StepId, unknown>>;
  errors: number;
}
export function startSolver(p: Problem): SolverState;
export function submitStep(s: SolverState, p: Problem, input: unknown): { state: SolverState; result: CheckResult };
export function goBack(s: SolverState): SolverState;

// engine/hintFader.ts
export type HintHistory = { problemId: string; hintsUsed: number; correct: boolean; wrongCount: number }[];
export function availableHintLevels(section: SequenceSection, history: HintHistory): 1 | 2 | 3;
export function requestHint(p: Problem, opened: number, available: number): { level: number; text: string } | null;

// engine/adaptivePath.ts
export function evaluateDiagnostic(results: Record<string, boolean>): { pass: boolean; remedials: string[] };

// engine/sequencer.ts
export function getNextItem(progress: Progress): { sectionId: string; itemId: string } | { done: true };
```

### Logger & effort

```ts
// data/repositories.ts
export type EventType = 'section_start' | 'section_end' | 'step_submit' | 'hint_open' | 'answer_submit'
  | 'sanity_check' | 'highlight' | 'replay' | 'scene_interact' | 'effort_rating' | 'self_explain';

export function logEvent(type: EventType, payload: Record<string, unknown>): Promise<void>;
export function rateEffort(sectionId: string, value: 1|2|3|4|5|6|7|8|9): Promise<void>;
export function saveAttempt(a: AttemptInput): Promise<void>;
export function saveReflection(r: ReflectionInput): Promise<void>;
export function getProgress(): Promise<Progress>;
export function exportCsv(kind: 'attempts' | 'events' | 'effort' | 'reflections'): Promise<Blob>; // dibagikan via Web Share API / unduh
export function flushSyncQueue(): Promise<{ sent: number; pending: number }>;
```

Setiap rekaman otomatis diberi `id` (UUID v4), `studentCode`, `sessionId`, `createdAt` (ISO 8601), `appVersion`.

## 3. Scene API

Semua scene (3D maupun fallback SVG) mengimplementasikan antarmuka yang sama.

```ts
// scenes/core/types.ts
export type Highlight = 'arc' | 'sector' | 'both' | 'none';

export interface SectorSceneOptions {
  radius: number;          // satuan dunia, label memakai nilai asli
  angle: number;           // derajat 0–360
  highlight?: Highlight;   // default 'both'
  showLabels?: boolean;    // default true
  topView?: boolean;       // default false
  reducedMotion?: boolean; // ikuti prefers-reduced-motion
}

export interface SceneHandle {
  setAngle(deg: number): void;
  setRadius(r: number): void;
  setHighlight(h: Highlight): void;
  setTopView(on: boolean): void;
  resetCamera(): void;
  onChange(cb: (s: { angle: number; radius: number }) => void): () => void;
  dispose(): void;
}

export function createSectorScene(el: HTMLElement, opts: SectorSceneOptions): SceneHandle;
export function createSectorLiftScene(el: HTMLElement, opts: SectorSceneOptions & { pieces: number }): SceneHandle & {
  lift(): void; arrange(): void;
};
export function createArcUnrollScene(el: HTMLElement, opts: SectorSceneOptions): SceneHandle & { unroll(): void };
export function createContextScene(el: HTMLElement, id: SceneId, opts: SectorSceneOptions): SceneHandle;

// scenes/core/webgl.ts
export function webglSupport(): boolean;
export function watchFps(handle: SceneHandle, minFps: number, onLow: () => void): () => void;
```

```tsx
// scenes/SceneView.tsx
<SceneView kind="circleSector" angle={90} radius={14} highlight="arc" onChange={...} />
// Memilih 3D atau SVG otomatis; memanggil dispose() saat unmount.
```

## 4. Backend (FastAPI + PostgreSQL)

> **Revisi ADR-017:** data disimpan oleh backend **Python FastAPI** ke PostgreSQL (Supabase/Neon hanya sebagai
> penyedia database). Skema tabel di bawah diimplementasikan di `backend/app/models.py` (SQLAlchemy). Kebijakan RLS
> dan fungsi SQL di §4.2–4.3 menjadi **acuan aturan akses** yang ditegakkan di endpoint FastAPI.
> Bagian §1–3 (tipe TypeScript) dibaca sebagai JSDoc di file `.js` (ADR-018).

### 4.0 Endpoint FastAPI

Dokumentasi interaktif otomatis: `http://127.0.0.1:8000/docs` (matikan di produksi dengan `DOCS_ENABLED=false`).

🔒 = wajib header `Authorization: Bearer <token>` dari `/api/auth/login`. Identitas siswa diambil dari token, bukan
dari body. Sesi tidak valid → **401** dengan `detail.code`: `not_authenticated`, `invalid_token`,
`session_replaced` (akun masuk di perangkat lain), `session_expired`, `session_revoked` (password direset),
`account_disabled`.

`results[]` (hasil akhir satu bagian): `{id, section_id, score|null, max_score|null, details{}, started_at, completed_at}`.
Skor = latihan: soal benar di percobaan pertama; diagnostik: jawaban benar; permainan: kartu tepat pada pilihan
pertama. Bagian materi hanya `score: null` (selesai). Disimpan di tabel `section_results`.

Sesi berlaku 30 hari dan diperpanjang setiap kali dipakai. Akun dikelola dengan
`python -m scripts.manage_accounts` (tidak ada dashboard guru).

| Metode | Path | Fungsi | Status |
|---|---|---|---|
| `GET` | `/api/health` | Status server, database, jumlah soal termuat | ✅ v0.2.0 |
| `POST` | `/api/auth/login` `{username, password}` → `{token, expires_at, student}` | Masuk siswa. Mencabut sesi lain akun ini (satu perangkat aktif). 401 `invalid_credentials`, 429 `too_many_attempts` | ✅ v0.4.0 |
| `POST` | `/api/auth/logout` 🔒 → 204 | Mencabut sesi yang sedang dipakai | ✅ v0.4.0 |
| `GET` | `/api/auth/me` 🔒 → `{code, class_code, username}` | Siswa yang sedang masuk | ✅ v0.4.0 |
| `POST` | `/api/practice/check` `{problem_id, value, unit?}` → `{correct, unit_ok, feedback, misconception_id}` | Pemeriksaan jawaban di server | ✅ v0.2.0 |
| `GET` | `/api/mltest` | Soal Uji Literasi T1–T4 **tanpa kunci & skor** | ✅ v0.3.0 |
| `GET` | `/api/mltest/status` 🔒 → `{pre_done, post_done, pre_score, pre_max, post_score, post_max}` | Status & skor uji | ✅ v0.5.0 |
| `POST` | `/api/mltest/submit` 🔒 `{submission_id, kind, answers}` → `{saved_items, score, max_score}` | Simpan & skor per tahap (idempoten). Jenis uji yang sama dari kiriman lain → **409** | ✅ v0.5.0 |
| `POST` | `/api/records` 🔒 `{attempts[], effort[], reflections[], results[]}` → `{inserted}` | Catatan belajar + hasil akhir per bagian (idempoten, id UUID) | ✅ v0.5.0 |
| `GET` | `/api/progress` 🔒 → `{sections: [{section_id, done, times_completed, last, best, last_completed_at}]}` | Progres & skor per bagian (beranda, pindah HP). Uji Awal/Akhir dihitung dari `ml_tests` | ✅ v0.5.0 |
| `POST` | `/api/sessions` | Membuat sesi | Sprint 5 |
| `GET` | `/api/research/export/{kind}.csv` | Ekspor CSV peneliti (role peneliti) | Sprint 5 |

### 4.1 Tabel

```sql
create table classes (
  code text primary key,               -- mis. "8A-2026"
  created_at timestamptz default now()
);

-- Guru (login Supabase Auth dengan email guru) dikaitkan ke kelas yang diampu
create table teacher_classes (
  teacher_id uuid references auth.users(id),
  class_code text references classes(code),
  primary key (teacher_id, class_code)
);

create table students (
  code text primary key,               -- "S01" — pseudonim, tanpa nama
  class_code text references classes(code),
  group_label text,                    -- opsional: "uji-kecil", "uji-lapangan"
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key,
  student_code text references students(code),
  started_at timestamptz not null,
  ended_at timestamptz,
  app_version text,
  device_class text                    -- "low" | "mid" | "high" (bukan model/ID perangkat)
);

create table attempts (
  id uuid primary key,
  session_id uuid references sessions(id),
  student_code text references students(code),
  problem_id text not null,
  section_id text not null,
  answer_value text,
  answer_unit text,
  correct boolean not null,
  misconception_id text,
  hints_used int not null default 0,
  duration_ms int,
  created_at timestamptz not null
);

create table hint_events (
  id uuid primary key,
  attempt_id uuid,
  student_code text references students(code),
  problem_id text not null,
  level int check (level between 1 and 3),
  created_at timestamptz not null
);

create table effort_ratings (
  id uuid primary key,
  student_code text references students(code),
  section_id text not null,
  value int check (value between 1 and 9),
  created_at timestamptz not null
);

create table reflections (
  id uuid primary key,
  student_code text references students(code),
  prompt_id text not null,
  choice text,
  free_text text,                     -- dipindai: tolak jika berisi pola nama/nomor HP
  score int check (score between 0 and 2),
  created_at timestamptz not null
);

create table events (
  id uuid primary key,
  student_code text references students(code),
  session_id uuid,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null
);

create table ml_tests (
  id uuid primary key,
  student_code text references students(code),
  kind text check (kind in ('pre','post')),
  item_id text not null,
  ml_process text check (ml_process in ('formulate','employ','interpret')),
  score numeric not null,
  max_score numeric not null,
  created_at timestamptz not null
);
```

### 4.2 Row Level Security

```sql
alter table attempts enable row level security;
-- (ulangi untuk semua tabel)

-- Aplikasi (role anon) hanya boleh INSERT, tidak boleh membaca data siapa pun.
create policy "anon insert" on attempts for insert to anon with check (true);
-- Tidak ada policy SELECT/UPDATE/DELETE untuk anon.

-- Peneliti membaca melalui role 'researcher' (login dasbor Supabase / service role di laptop peneliti).
create policy "researcher read" on attempts for select to authenticated
  using (auth.jwt() ->> 'role' = 'researcher');
```

`students`, `classes`, dan `teacher_classes` diisi peneliti sebelum uji coba; aplikasi memvalidasi kode melalui RPC
berikut. Guru tidak pernah membaca tabel mentah — hanya fungsi `class_recap` yang memeriksa `teacher_classes`.

### 4.3 Endpoint (PostgREST/RPC)

| Metode | Endpoint | Fungsi | Role |
|---|---|---|---|
| `POST` | `/rest/v1/rpc/verify_student` `{ code, class_code }` | Mengembalikan `{ valid: boolean }` | anon |
| `POST` | `/rest/v1/sessions` | Membuat sesi | anon (insert) |
| `POST` | `/rest/v1/attempts` (header `Prefer: resolution=ignore-duplicates`) | Batch upsert attempts | anon (insert) |
| `POST` | `/rest/v1/hint_events` | Batch | anon |
| `POST` | `/rest/v1/effort_ratings` | Batch | anon |
| `POST` | `/rest/v1/reflections` | Batch | anon |
| `POST` | `/rest/v1/events` | Batch | anon |
| `POST` | `/rest/v1/rpc/get_my_progress` `{ code, class_code }` | Progres milik siswa itu sendiri (pindah HP) | anon |
| `POST` | `/rest/v1/rpc/class_recap` `{ p_class_code }` | Rekap per kode siswa untuk guru (F15) | authenticated (guru) |
| `GET` | `/rest/v1/attempts?select=*&student_code=eq.S01` | Analisis | researcher |

```sql
create function verify_student(code text, class_code text)
returns json language sql security definer as $$
  select json_build_object('valid', exists(
    select 1 from students s where s.code = verify_student.code and s.class_code = verify_student.class_code));
$$;

-- Rekap guru: hanya untuk kelas yang diampu pemanggil
create function class_recap(p_class_code text)
returns table (
  student_code text,
  sections_done int,
  attempts int,
  accuracy numeric,          -- 0..1
  avg_hints numeric,
  avg_effort numeric,        -- skala Paas 1..9
  last_active timestamptz
) language sql security definer as $$
  select s.code,
         (select count(distinct e.payload->>'sectionId') from events e
            where e.student_code = s.code and e.type = 'section_end')::int,
         count(a.id)::int,
         avg(case when a.correct then 1 else 0 end),
         avg(a.hints_used),
         (select avg(value) from effort_ratings r where r.student_code = s.code),
         greatest(max(a.created_at), (select max(created_at) from events e2 where e2.student_code = s.code))
  from students s
  left join attempts a on a.student_code = s.code
  where s.class_code = p_class_code
    and exists (select 1 from teacher_classes t
                where t.teacher_id = auth.uid() and t.class_code = p_class_code)
  group by s.code
  order by s.code;
$$;
```

### 4.5 Tampilan rekap guru (F15)

| Kode | Bagian selesai | Akurasi | Rata-rata petunjuk | Rata-rata usaha (1–9) | Aktif terakhir |
|---|---|---|---|---|---|
| S01 | 6/8 | 78% | 1,2 | 5,0 | 10:42 |

Penanda sederhana (teks + ikon, bukan hanya warna): **Perlu bantuan** bila akurasi < 50% **atau** usaha rata-rata ≥ 7.
Halaman dimuat ulang manual (tombol "Perbarui"), tidak real-time.

### 4.4 Format ekspor CSV (analisis SPSS/Excel)

`attempts.csv`: `student_code,section_id,problem_id,level,ml_process,correct,hints_used,misconception_id,duration_ms,created_at`
`effort.csv`: `student_code,section_id,value,created_at`
`ml_tests.csv`: `student_code,kind,item_id,ml_process,score,max_score`

Pemisah koma, desimal titik, UTF-8, satu baris header.
