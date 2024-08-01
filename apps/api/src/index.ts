import { Application } from './application.js';

try {
  // TODO: improve error handling
  await new Application().start();
} catch (error) {
  console.error(error);

  process.exit(1);
}
