import path from 'path';
import { beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

const feedPath = path.join(__dirname, 'support', 'feeds');

beforeAll(() => {
  // Add your global beforeAll logics
  process.env.FEEDS_PATH = feedPath;
});

beforeEach(() => {
  // Add your globalbeforeEach logics
});

afterAll(() => {
  // Add your global afterAll logics
});

afterEach(() => {
  // Add your global afterEach logics
});
