import { connectDatabase } from '../config/db.js';
import { ensureSeededProblems } from '../services/problemService.js';

async function main() {
  await connectDatabase();
  await ensureSeededProblems();
  console.log('Seed complete');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
