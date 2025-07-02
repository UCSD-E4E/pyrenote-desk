# Pyrenote Desktop

  

## Intro

  

Welcome to Pyrenote Desktop! A web application developed by the Acoustic Species Identification team with the Engineers for Exploration at UC San Diego with input and guidance from conservation collaborators at the San Diego Zoo. We are grateful for their help and guidance throughout the process from providing test data to domain-specific knowledge and expertise and hope they will find the application useful in their future conservation efforts!

  

## Setup

  

We are using `yarn` for this application! Please install `yarn` with `npm install -g yarn` ([tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-the-yarn-package-manager-for-node-js)).

  

Enter `yarn && yarn dev` into the terminal, and the application should install all your dependencies and open up a new electron window!

  

## Workflow

  

Though we hope each user will use the app in their own unique way best suited to their needs the intended workflow is as follows:

- Utilize the settings page to modify the apps and its features to the user's desires or import a settings preset if working on behalf of an organization

- On the database page, upload audio files

- Using the Model page, run a pretrained or custom model on files from a certain deployment, saving model classifications to the database

- (Optionally) Allow expert human labelers to use the labeling page to manually identify and classify audio data

- The Verify page serves as a tool allowing experts to quickly and efficiently verify the model's or human labellers' labels, and easily correct those labels if needed

  

## Specifics

  

#### Settings

  

The settings page allows for customization of a variety of features on each of the pages of the application - these settings are saved using local storage and will persit locally on the user's device between app sesions, but will not persist if the application is deleted and reinstalled. Settings can be exported to save them and can be imported on any device with access to the exported .json file. Settings can also be easily reset to their defaults though at the time there is no way to quickly restore the previous settings once resetting to default.

  

#### Database

  

#### Model

  

(TODO: Add more once model backend is more fleshed out) The model page contains the user interface for running a classification model on audio data.

  

#### Labeling

  

The labeling page allows the user to verify and label one or multiple audio files in more detail.

To Upload Files

- Click the "Choose Files button" to load one or more audio files

- Switch between files with the left and right arrow icons or corresponding keyboard keys

Create/Label Regions

- Click and drag on the waveform to define a region

- To mark a region or unmark a region as selected, click it once, which highlights it

- To label a region, double‑click the region, type the label, then press Enter

- Alternatively, select a region, then choose a species from the “Choose a species” dropdown

Manage Regions

- Under the "Region buttons" section, click "Delete" to remove a selected region

- Click "Clear" to remove all regions

- Click "Undo" to remove the most recently created regions

- Click "Save Labels" to add all current labels onto the "Choose a species" dropdown

Playback Controls

- Press the play/pause button or "P" to start and stop audio

- Press the save button or "W" to save a document with includes start and end times, confidence scores, call types, and additional notes

- Press the delete button or "D" to delete the current file

  

#### Verification
This page allows you to select audio files from your disk and manually verify if their label is correct. Currently accepted file types are ***.mp3***, ***.wav***, and ***.json***
  
All files are initially in the 'Unverified' state. Use the ***z***, ***x***, ***c*** keys to toggle between the 'Unverified', 'Valid', and 'Invalid' states respectively.

You can box select multiple at once by clicking and dragging.

You can save your progress by clicking the "Save" icon to create a JSON file containing all verification states, your current page, and file paths to all the audio files (moving your files will cause unintended behavior and can break the save).

To bring back your progress, select your JSON in file selection.

You can enable a detailed view of an individual audio file by selecting a spectrogram and pressing the ***o*** key. This view will have a higher resolution spectrogram as well as the ability to modify its species label. Press ***ESC*** to exit out of the detailed view.

To modify the species label of selected spectrograms(s), press ***Shift***.
|Verify Page: Features		 				|Default Key(s)
|-------------------------------------------|-------------------------------|
|Move selection	(all 4 directions) 			|`WASD` or `arrow keys`         |
|Move selection forward (next audio file)   |`tab` 				           	|
|Change verification state 					|`z`, `x`, `c`					|
|Play/pause selected 						|`Space` or `right click`		|
|Skip forward/backward in audio playback 	|`.` and `,` 					|
|Increase/decrease skip interval		 	|`l` and `k` 					|
|Increase/decrease audio playback rate		|`m` and `n` 					|
|Reset skip interval & playback rate to default |	`r`						|
|Increase/decrease columns					|`'` and `;`					|
|Increase/decrease columns					|`'` and `;`					|
|Remove selected files (careful!) 			|`Backspace`					|
|Next/previous page 						|`Enter` and `\` 				|
|Enter/exit detailed view					|`o` and `Esc`					|
|Edit species label of selected audio		|`Shift`						|

###### Overview

This page allows you to select audio files from your disk and manually verify if their label is correct. Currently accepted file types are ***.mp3***, ***.wav***, and ***.json***
 

###### Verification

All files are initially in the 'Unverified' state. Use the ***z***, ***x***, ***c*** keys to toggle between the 'Unverified', 'Valid', and 'Invalid' states respectively.

You can box select multiple at once by clicking and dragging.

###### Saving

You can save your progress by clicking the "Save" icon to create a JSON file containing all verification states, your current page, and file paths to all the audio files (moving your files will cause unintended behavior and can break the save).

To bring back your progress, select your JSON in file selection.

###### Detailed View

You can enable a detailed view of an individual audio file by selecting a spectrogram and pressing the ***o*** key. This view will have a higher resolution spectrogram as well as the ability to modify its species label. Press ***ESC*** to exit out of the detailed view.

###### Labeling 

To modify the species label of selected spectrograms(s), press ***Shift***.

###### All features and keybinds

|FEATURE		 							|DEFAULT KEYS
|-------------------------------------------|-------------------------------|
|Move selection	(all 4 directions) 			|`WASD` or `arrow keys`         |
|Move selection forward (next audio file)   |`tab` 				           	|
|Change verification state 					|`z`, `x`, `c`					|
|Play/pause selected 						|`Space` or `right click`		|
|Skip forward/backward in audio playback 	|`.` and `,` 					|
|Increase/decrease skip interval		 	|`l` and `k` 					|
|Increase/decrease audio playback rate		|`m` and `n` 					|
|Reset skip interval & playback rate to default |	`r`						|
|Increase/decrease columns					|`'` and `;`					|
|Increase/decrease columns					|`'` and `;`					|
|Remove selected files (careful!) 			|`Backspace`					|
|Next/previous page 						|`Enter` and `\` 				|
|Enter/exit detailed view					|`o` and `Esc`					|
|Edit species label of selected audio		|`Shift`						|

## Development

  

This uses a package called [Nextron](https://blog.logrocket.com/building-app-next-js-electron/) to combine Electron and Next.js. All [Next.js](https://nextjs.org/) code can be found in the `/renderer` directory. Additionally, code is written in [TypeScript](https://www.typescriptlang.org/).

  
## BackEnd Documentation
Please see this [attached document](https://docs.google.com/document/d/10autWGSIJDS4cQx3b90XQbgZoM-lmTRWkSTbVVMZHbs/edit?usp=sharing) for documentation about the backend development of the desktop app. 

## Acknowledgements



