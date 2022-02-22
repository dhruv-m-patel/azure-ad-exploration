// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { AuthenticationResult } from '@azure/msal-node';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getTokensFromAuthorizationCode,
  redeemCodeForTokens,
  transformToken,
} from '../../lib/aadB2cHelpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send({ error: 'code is missing from request' });
  }
  const result = await redeemCodeForTokens({
    code,
    redirectUri: process.env.AZURE_AD_REDIRECT_URI as string,
  });
  if (result) {
    const now = new Date(Date.now());
    const tokensFromMsalNodeClient = transformToken(
      result as AuthenticationResult,
      now
    );
    const tokensFromRestCall = await getTokensFromAuthorizationCode(code);
    res.send({
      ...tokensFromMsalNodeClient,
      ...tokensFromRestCall,
    });
  } else {
    res.status(401);
  }
}
