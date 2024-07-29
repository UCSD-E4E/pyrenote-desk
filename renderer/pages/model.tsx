import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

//File Upload Button appears at top left of model page and disappears while model runs
function FileUploadButton({onClick}){
    return (
        <button onClick={onClick}
            style={{
            width: '150px', 
            height: '150px', 
            background: `url(/images/SelectFileButton.png) no-repeat center center`,
            backgroundSize: 'cover',
            cursor: 'pointer',
            border: 'none',
            padding: 10,
            margin: '10px',
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
            width: '150px', 
            height: '150px', 
            background: `url(/images/CancelButton.png) no-repeat center center`,
            backgroundSize: 'cover',
            cursor: 'pointer',
            border: 'none',
            padding: 10,
            margin: '10px',
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
  

  const images = ['/images/MagnusDefault.png',
                  '/images/MagnusSing1.png',
                  '/images/MagnusSing2.png',
                  '/images/MagnusSing.png'];
  const messages = ['Model is running   ',
                    'Model is running.  ',
                    'Model is running.. ',
                    'Model is running...'];

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

      <div>
        {isButtonVisible && <FileUploadButton onClick = {HandleClick}/>}
        {!isButtonVisible && <CancelButton onClick = {HandleCancelClick}/>}
        <SuccessButton onClick = {HandleSuccessClick}/>
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

        {successTextVisible && <><p>
            Magnus has successfully labeled the data!    
        </p> <p>
            Check out the database & label tab to examine the results or upload more data for labeling.
        </p></>}
        
      </div>
    </React.Fragment>
  )
}
