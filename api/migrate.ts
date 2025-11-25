import { execSync } from 'child_process';

export default function handler(req, res) {
  const result = execSync('npx prisma db push', { encoding: 'utf8' });
  res.status(200).send(result);
}
