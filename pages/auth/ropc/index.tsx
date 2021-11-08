import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../../../styles/RopcLoginPage.module.css'

interface RopcLoginPageProps {
  loginUrl: string;
  azureAdAppId: string;
}

const RopcLoginPage: NextPage<RopcLoginPageProps> = ({ loginUrl, azureAdAppId }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Azure AD - ROPC Flow</title>
        <meta name="description" content="Azure AD - ROPC Flow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h2 className={styles.title}>
          Welcome to Azure AD Resource Owner Passwod Credentials (ROPC) flow!
        </h2>
        <form method="post" action={loginUrl}>
          <input name="username" type="text" placeholder="Enter username" maxLength={50} />
          <br />
          <input name="password" type="password" placeholder="Enter password" />
          <br />
          <input name="grant_type" type="hidden" value="password" />
          <input name="scope" type="hidden" value={`openid ${azureAdAppId} offline_access`} />
          <input name="client_id" type="hidden" value={azureAdAppId} />
          <input name="response_type" type="hidden" value="token id_token" />
          <button type="submit">Attempt Login</button>
        </form>
      </main>
    </div>
  )
}

// This function gets called at build time
export async function getStaticProps() {
  const loginUrl = process.env.AZURE_AD_ROPC_FLOW_LOGIN_URL;
  const azureAdAppId = process.env.AZURE_AD_APP_ID;
  /*
  NOTE: Tried sending same request the UI would send using a fetch request with post options
        however this fails with following example response:

  data {
    error: 'invalid_request',
      error_description: 'AADB2C90083: The request is missing required parameter: grant_type.\r\n' +
       'Correlation ID: b898c6f3-4f9f-492c-8b3c-103cdd54642d\r\n' +
       'Timestamp: 2021-11-08 16:09:22Z\r\n'
      }
  */
  // const res = await fetch(loginUrl as string, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     username: 'email@example.com', // replace value here with actual user email
  //     password: 'secretPassword', // replace value here with actual user password
  //     grant_type: 'password',
  //     scope: `openid ${azureAdAppId} offline_access`,
  //     client_id: azureAdAppId,
  //     response_type: 'token id_token',
  //   }),
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Accept: 'application/json'
  //   }
  // });
  // const data = await res.json();
  // console.log('data', data);
  return {
    props: {
      loginUrl,
      azureAdAppId,
    },
  }
}


export default RopcLoginPage
