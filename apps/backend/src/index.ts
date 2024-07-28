import { Application } from './core/application.js';

try {
  // TODO: improve error handling
  await Application.start();
} catch (error) {
  console.error(error);

  process.exit(1);
}
