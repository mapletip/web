import { node } from '@mapletip/config/eslint/node';
import vitestRules from '@mapletip/config/eslint/vitest';

export default [...node(import.meta.dirname), ...vitestRules];
