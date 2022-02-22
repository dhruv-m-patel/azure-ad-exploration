// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthCodeUrl } from '../../lib/aadB2cHelpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = await getAuthCodeUrl({
    redirectUri: process.env.AZURE_AD_REDIRECT_URI as string,
    prompt: 'login',
  });
  res.json({ loginUrl: url });
}
