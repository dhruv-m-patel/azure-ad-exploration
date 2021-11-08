import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

interface HomePageProps {
  name: string
}

const Home: NextPage<HomePageProps> = ({ name }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Azure AD Exploration</title>
        <meta name="description" content="Azure AD Exploration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Azure AD Exploration!
        </h1>
        <p>Welcome, {name}</p>
        <p>
          <a href="/auth/ropc">Resource Owner Password Credentials (ROPC) flow</a>
        </p>
      </main>
    </div>
  )
}

// This function gets called at build time
export async function getStaticProps() {
  const host = process.env.HOST || 'http://localhost:3000';
  // Call an external API endpoint to get posts
  const res = await fetch(`${host}/api/hello`)
  const { name } = await res.json()

  return {
    props: {
      name,
    },
  }
}


export default Home
