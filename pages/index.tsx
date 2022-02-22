import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

interface HomePageProps {
  loginUrl: string;
}

const Home: NextPage<HomePageProps> = ({ loginUrl }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Azure AD Exploration</title>
        <meta name="description" content="Azure AD Exploration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Azure AD Exploration!</h1>
        <p>
          <a href={loginUrl}>Click here to login</a>
        </p>
      </main>
    </div>
  );
};

export async function getServerSideProps() {
  const host = process.env.HOST || 'http://localhost:3000';
  // Call an external API endpoint to get posts
  const res = await fetch(`${host}/api/login`);
  const { loginUrl } = await res.json();

  return {
    props: {
      loginUrl,
    },
  };
}

export default Home;
