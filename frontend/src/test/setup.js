import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest tanpa `globals: true` tidak menjalankan cleanup otomatis Testing Library
afterEach(() => cleanup());
