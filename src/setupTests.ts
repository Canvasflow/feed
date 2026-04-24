import path from 'path';
import { beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

const supportPath = path.join(__dirname, 'support');
const feedPath = path.join(supportPath, 'feeds');

beforeAll(() => {
  // Add your global beforeAll logics
  process.env.SUPPORT_PATH = supportPath;
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
