import { NextApiRequest, NextApiResponse } from 'next';
import { refreshTokens } from '../../lib/aadB2cHelpers';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const result = await refreshTokens(request.body.refreshToken);

  if (result === null) {
    console.log('Refresh token not valid');
    response.status(401).json({ message: 'Refresh token was not valid' });
  }

  return result;
}
