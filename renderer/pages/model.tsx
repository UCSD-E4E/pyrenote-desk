import React from "react";
import Head from "next/head";
import Image from "next/image";
import styles from "./model.module.css";

//File Upload Button appears at top left of model page and disappears while model runs
function FileUploadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "200px",
        height: "200px",
        // background: `url(/images/SelectFileButton.png) no-repeat center center`,
        background: `url(/images/run-model-button.png) no-repeat center center`,
        backgroundSize: "cover",
        cursor: "pointer",
        border: "none",
        margin: "1px",
        objectFit: "contain",
      }}
    ></button>
  );
}

// function ModelDropdown() {
//   return (
//     <select name="model-names" id="model-names">
//       <option value="acoustic-multiclass-training">acoustic-multiclass-training</option>
//     </select>
//   );
// }
//Cancel Button appears while model is running, replacing file select button
// function CancelButton({ onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       style={{
//         width: "120px",
//         height: "120px",
//         background: `url(/images/CancelButton.png) no-repeat center center`,
//         backgroundSize: "cover",
//         cursor: "pointer",
//         border: "none",
//         margin: "1px",
//         objectFit: "contain",
//       }}
//     ></button>
//   );
// }

//button for testing purposes - HandleSuccessClick() should be called when model successfully completes
function SuccessButton({ onClick }) {
  return (
    <button onClick={onClick}>
      Click to Test Success Behavior [placeholder]
    </button>
  );
}

//Main Model Page Component
export default function ModelPage() {
  const [isButtonVisible, setIsButtonVisible] = React.useState(true);
  const [origionalTextVisible, setOrigionalTextVisible] = React.useState(true);
  const [loadingTextVisible, setLoadingTextVisible] = React.useState(false);
  const [successTextVisible, setSuccessTextVisible] = React.useState(false);
  const [origionalImageVisible, setOrigionalImageVisible] =
    React.useState(true);
  const [imageIndex, setImageIndex] = React.useState(0);
  const [messageIndex, setMessageIndex] = React.useState(0);

  //variables can have values NODEJS.Timeout OR null - initialize both to null
  const imageIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const images = [
    "/images/MagnusDefault.png",
    "/images/MagnusSing1.png",
    "/images/MagnusSing2.png",
    "/images/MagnusSing.png",
  ];
  const messages = [
    "Model is running   ",
    "Model is running.  ",
    "Model is running.. ",
    "Model is running...",
  ];

  //Replace with Bird Puns at some point?
  const loadingBar = [
    "#######",
    "##############",
    "#####################",
    "############################",
  ];

  // Start image and message rotation when the component mounts
  const startImageRotation = () => {
    imageIntervalRef.current = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex + 1) % 4);
    }, 300);

    messageIntervalRef.current = setInterval(() => {
      setMessageIndex((prevMessageIndex) => (prevMessageIndex + 1) % 4);
    }, 300);
  };

  // Stop image and message rotation when the component unmounts or when the model stops
  const stopImageRotation = () => {
    clearInterval(imageIntervalRef.current);
    imageIntervalRef.current = null;
    //stop image cycle

    clearInterval(messageIntervalRef.current);
    messageIntervalRef.current = null;
    //stop message cycle
  };


  // function HandleClick() {
  //   alert("Running inference script");
  //   window.api.runScript(); //call inference script
  //   // TODO: Add Backend Functionality Here
  //   setIsButtonVisible(false);
  //   setOrigionalImageVisible(false);
  //   setOrigionalTextVisible(false);
  //   setLoadingTextVisible(true);
  //   setSuccessTextVisible(false);
  //   startImageRotation();
  // }
  async function HandleClick() {
    setIsButtonVisible(false);
    setOrigionalImageVisible(false);
    setOrigionalTextVisible(false);
    setLoadingTextVisible(true);
    setSuccessTextVisible(false);
    startImageRotation();

    try {
      await window.api.runScript(); // resolves when Python exits (annotations inserted)
      // success:
      setSuccessTextVisible(true);
    } catch (err) {
      console.error("Inference error:", err);
      alert("Inference failed. Check logs.");
      // optional: revert to original UI on failure
      setOrigionalImageVisible(true);
      setOrigionalTextVisible(true);
      setSuccessTextVisible(false);
    } finally {
      setLoadingTextVisible(false);
      stopImageRotation();
      setIsButtonVisible(true);
    }
  }

  //defines click behavior of Cancel button
  //TODO : implement this when model is done running 
  function HandleCancelClick() {
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
  function HandleSuccessClick() {
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
      <div className={styles.magnus}>
        <div className={styles.images}>
          <div>
            {isButtonVisible && <FileUploadButton onClick={HandleClick} />}
            {/* {!isButtonVisible && <CancelButton onClick={HandleCancelClick} />} */}
          </div>

          <div style={{ textAlign: "center" }}>
            {origionalImageVisible && (
              <Image
                src="/images/MagnusDefault.png"
                alt="Image of Bird"
                width={610}
                height={400}
              />
            )}

            {!origionalImageVisible && (
              <Image
                src={images[imageIndex]}
                alt="Image of Bird Singing"
                width={610}
                height={400}
              />
            )}

            {origionalTextVisible && (
              <>
                <p>
                  Magnus is waiting for you to run the model over all recordings in selected database.
                </p>
                <p>Let's get Labeling!</p>
              </>
            )}

            {loadingTextVisible && <p>{messages[messageIndex]}</p>}
            {loadingTextVisible && <p>{loadingBar[messageIndex]}</p>}

            {successTextVisible && (
              <>
                <p>Magnus has successfully labeled the data!</p>{" "}
                <p>
                  Check out the database tab, then navigate to the Analytics button to examine the results or
                  upload more data for labeling.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
