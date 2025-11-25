import { execSync } from 'child_process';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = execSync('npx prisma db push', { encoding: 'utf8' });
    res.status(200).send(result);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}
