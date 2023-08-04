// @ts-nocheck

import SdkAuth from '@commercetools/sdk-auth';
import fetch from 'node-fetch';

let authClient;

export const getAuthToken = async () => {
  if (!authClient) {
    authClient = new SdkAuth({
      host: 'https://auth.europe-west1.gcp.commercetools.com',
      projectKey: process.env.CTP_PROJECT_KEY,
      disableRefreshToken: false,
      credentials: {
        clientId: process.env.CTP_CLIENT_ID,
        clientSecret: process.env.CTP_CLIENT_SECRET,
      },
      scopes: [`manage_project:${process.env.CTP_PROJECT_KEY}`],
      fetch,
    })
  }

  const token = await authClient.clientCredentialsFlow()

  console.log('token', token.access_token);

  return `Bearer ${token['access_token']}`
}