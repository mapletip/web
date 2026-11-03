import { lib } from '@mapletip/config/vite/lib';
import { argv } from 'node:process';

const config = lib({
  entry: ['src/index.ts', 'src/styles.ts'],
  cssFileName: 'styles',
});

if (argv.includes('--watch')) {
  config.build = {
    ...config.build,
    watch: { exclude: ['dist/**'] },
  };
}

export default config;
