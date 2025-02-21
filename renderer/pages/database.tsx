import React, { useState } from 'react';
import UserForm from './next';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './database.module.css'

//questions for 11/15 meeting: what exactly is uploaded to database? How to display??? Clarify collab meeting notes about verification page

export default function databasePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);

    const toHome = () => {
        window.location.href = '/home';
      };
      const toData = () => {
        window.location.href = '/database';
      };
      const toModel = () => {
        window.location.href = '/model';
      };
      const toLabel = () => {
        window.location.href = '/label';
      };
  
    const handleSubmit = (event) => {
      event.preventDefault();
        // Display the user's input in an alert
        alert(`Name: ${name}\nEmail: ${email}`);
          
        // Reset the form fields
        setName('');
        setEmail('');
        setLoggedIn(true);
    };
    
      return (
        <React.Fragment>
          <Head>
            <title>Home - Magnus (basic-lang-typescript)</title>
          </Head>
          <div className={styles.container}>
            <div>
              <div className={styles.home} onClick = {toHome}>
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
              <div className={styles.database} onClick = {toData}>
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
              <div className={styles.model} onClick = {toModel}>
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
              <div className={styles.label} onClick = {toLabel}>
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
            <div className={styles.main}>
            
            {!loggedIn && <div><h1>User Login</h1>
            <form onSubmit={handleSubmit}>
                <div>
                <label>
                    Name:
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    />
                </label>
                </div>
                <div>
                <label>
                    Email:
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </label>
                </div>
                <button type="submit">Submit</button>
            </form></div>}

            </div>
            </div>
        </React.Fragment>
      )
}