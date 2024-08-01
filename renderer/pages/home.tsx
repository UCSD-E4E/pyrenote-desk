import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './home.module.css'

export default function HomePage() {
  const [message, setMessage] = React.useState('No message found')

  React.useEffect(() => {
    window.ipc.on('message', (message: string) => {
      setMessage(message)
    })
  }, [])

  return (
    <React.Fragment>
      <Head>
        <title>Home - Magnus (basic-lang-typescript)</title>
      </Head>
      <div className={styles.container}>
        <div>
          <div className={styles.home}>
            <Image
              src="/images/home.png"
              alt="Home image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/next">
              <span className={styles.linkStyle}>Home</span>
            </Link>
          </div>
          <div className={styles.database}>
            <Image
              src="/images/database.png"
              alt="Database image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/next">
              <span className={styles.linkStyle}>Database</span>
            </Link>
          </div>
          <div className={styles.model}>
            <Image
              src="/images/model.png"
              alt="Model image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/model">
              <span className={styles.linkStyle}>Model</span>
            </Link>
          </div>
          <div className={styles.label}>
            <Image
              src="/images/tag.png"
              alt="Label image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/label">
              <span className={styles.linkStyle}>Label</span>
            </Link>
          </div>
        </div>
        <br/>
        <br/>
        <br/>
        <br/>
        <div className={styles.magnus}>
          <br/>
          <h1>MagnusNote</h1>
          <div className={styles.intro}>
            <br/>
            <br/>
            <h2>Welcome to MagnusNote</h2>
            <p>
              Short Introduction or Major Features
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam nisl enim,
              pellentesque et consectetur mattis, porttitor id dui. Suspendisse neque urna,
              ornare eget augue eget, porta auctor neque. Vivamus sit amet accumsan ipsum,
              a vulputate lorem. In metus ligula, sodales ac augue vitae, facilisis scelerisque justo.
              Vivamus condimentum massa ex, vel posuere orci...
            </p>
            <br/>
            <Image
              src="/images/youtube.png"
              alt="Label image"
              width={15}
              height={15}
            />
            <a href="https://youtu.be/xvFZjo5PgG0" target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              Learn more about Magnusnote
            </a>
          </div>
        </div>
      </div>
      <div>
        <button
          onClick={() => {
            window.ipc.send('message', 'Hello')
          }}
        >
          Test IPC
        </button>
        <p>{message}</p>
      </div>
    </React.Fragment>
  )
}
