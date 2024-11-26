import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <React.Fragment>
      <Head>
        <title>Home - Magnus (basic-lang-typescript)</title>
      </Head>
      <div className={styles.container}>
        <br />
        <br />
        <br />
        <br />
        <div className={styles.magnus}>
          <br />
          <h1>MagnusNote</h1>
          <div className={styles.intro}>
            <br />
            <br />
            <h2>Welcome to MagnusNote</h2>
            <p>
              Short Introduction or Major Features Lorem ipsum dolor sit amet,
              consectetur adipiscing elit. Nam nisl enim, pellentesque et
              consectetur mattis, porttitor id dui. Suspendisse neque urna,
              ornare eget augue eget, porta auctor neque. Vivamus sit amet
              accumsan ipsum, a vulputate lorem. In metus ligula, sodales ac
              augue vitae, facilisis scelerisque justo. Vivamus condimentum
              massa ex, vel posuere orci...
            </p>
            <br />
            <Image
              src="/images/youtube.png"
              alt="Label image"
              width={15}
              height={15}
            />
            <a
              href="https://youtu.be/xvFZjo5PgG0"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              Learn more about Magnusnote
            </a>
          </div>
        </div>
      </div>
      <div></div>
    </React.Fragment>
  );
}
