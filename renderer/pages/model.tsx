import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import styles from './model.module.css'

//File Upload Button appears at top left of model page and disappears while model runs
function FileUploadButton({onClick}){
    return (
        <button onClick={onClick}
            style={{
            width: '120px', 
            height: '120px', 
            background: `url(/images/SelectFileButton.png) no-repeat center center`,
            backgroundSize: 'cover',
            cursor: 'pointer',
            border: 'none',
            margin: '1px',
            objectFit: 'contain'
          }}>      
        </button>
    )
}
//Cancel Button appears while model is running, replacing file select button
function CancelButton({onClick}){
    return (
        <button onClick={onClick}
            style={{
            width: '120px', 
            height: '120px', 
            background: `url(/images/CancelButton.png) no-repeat center center`,
            backgroundSize: 'cover',
            cursor: 'pointer',
            border: 'none',
            margin: '1px',
            objectFit: 'contain'
          }}>      
        </button>
    )
}

//button for testing purposes - HandleSuccessClick() should be called when model successfully completes
function SuccessButton({onClick}){
    return (
        <button onClick={onClick}>      
            Click to Test Success Behavior [placeholder]
        </button>
    )
}

export default function ModelPage() {
  const [isButtonVisible, setIsButtonVisible] = React.useState(true);
  const [origionalTextVisible, setOrigionalTextVisible] = React.useState(true);
  const [loadingTextVisible, setLoadingTextVisible] = React.useState(false);
  const [successTextVisible, setSuccessTextVisible] = React.useState(false);
  const [origionalImageVisible, setOrigionalImageVisible] = React.useState(true);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [messageIndex, setMessageIndex] = React.useState(0);

  //variables can have values NODEJS.Timeout OR null - initialize both to null
  const imageIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const toHome = () => {
    window.location.href = '/home';
  };
  const toData = () => {
    window.location.href = '/next';
  };
  const toModel = () => {
    window.location.href = '/model';
  };
  const toLabel = () => {
    window.location.href = '/label';
  };

  const images = ['/images/MagnusDefault.png',
                  '/images/MagnusSing1.png',
                  '/images/MagnusSing2.png',
                  '/images/MagnusSing.png'];
  const messages = ['Model is running   ',
                    'Model is running.  ',
                    'Model is running.. ',
                    'Model is running...'];

  //Replace with Bird Puns at some point?
  const loadingBar = ['#######',
                      '##############',
                      '#####################',
                      '############################'
                      ];
                      

   const startImageRotation = () => {
        imageIntervalRef.current = setInterval(() => {setImageIndex
        ((prevIndex) => (prevIndex + 1) % 4);}, 300); 
        // Change image 

        messageIntervalRef.current = setInterval(() => {setMessageIndex    ((prevMessageIndex) => (prevMessageIndex + 1) % 4);}, 300); 
        // Change message 
   };

   const stopImageRotation = () => {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
        //stop image cycle

        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
        //stop message cycle
    };
  
  //defines click behavior of file select button
  function HandleClick(){
    alert("Clicked");
    // TODO: Add Backend Functionality Here  
    setIsButtonVisible(false);
    setOrigionalImageVisible(false);
    setOrigionalTextVisible(false);
    setLoadingTextVisible(true);
    setSuccessTextVisible(false);
    startImageRotation();
  }

  //defines click behavior of Cancel button
  function HandleCancelClick(){
    alert("Canceled");
    // TODO: Add Backend Functionality Here  
    setIsButtonVisible(true);
    setOrigionalImageVisible(true);
    setOrigionalTextVisible(true);
    setLoadingTextVisible(false);
    setSuccessTextVisible(false);
    stopImageRotation();
  }

  
  //defines behavior of model success
  function HandleSuccessClick(){
    alert("Success");
    // TODO: Add backend Functionality Here
    setOrigionalImageVisible(true);
    setOrigionalTextVisible(false);
    setIsButtonVisible(true);
    setSuccessTextVisible(true);
    setLoadingTextVisible(false);
    stopImageRotation();
  }

  return (
    <React.Fragment>
      <Head>
        <title>Model Page</title>
      </Head>
      <div className ={styles.container}>
     
      <div>
          <div className={styles.home} onClick={toHome}>
            <Image
              src="/images/home.png"
              alt="Home image"
              width={45}
              height={45}
            />
            <br />
            <Link href="/home">
              <span className={styles.linkStyle}>Home</span>
            </Link>
          </div>
          <div className={styles.database} onClick={toData}>
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
          <div className={styles.model} onClick={toModel}>
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
          <div className={styles.label} onClick={toLabel}>
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
        <div className={styles.magnus}>
        <div className = {styles.images}>
      <div>
        {isButtonVisible && <FileUploadButton onClick = {HandleClick}/>}
        {!isButtonVisible && <CancelButton onClick = {HandleCancelClick}/>}
        
      </div>

      <div style={{ textAlign: 'center' }}>
      
        {origionalImageVisible && <Image
          src="/images/MagnusDefault.png" 
          alt="Image of Bird" 
          width={610}
          height={400}
        />}

        {!origionalImageVisible && <Image
          src={images[imageIndex]} 
          alt="Image of Bird Singing" 
          width={610}
          height={400}/>}
        
        {origionalTextVisible && <><p>
            Magnus is waiting for you to select audio clip(s) from the library.
        </p><p>
            Let's get Labeling!
        </p></>}

        {loadingTextVisible && <p>
            {messages[messageIndex]}
        </p>}
        {loadingTextVisible && <p>
          {loadingBar[messageIndex]}</p>}

        {successTextVisible && <><p>
            Magnus has successfully labeled the data!    
        </p> <p>
            Check out the database & label tab to examine the results or upload more data for labeling.
        </p></>}
        </div>
        </div>
        </div>
        </div>
    </React.Fragment>
  )
}
