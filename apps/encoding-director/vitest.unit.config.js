import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import config from '../../vitest.config.js';

export default mergeConfig(config, defineConfig({}));
