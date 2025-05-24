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

#### Verification

## Development

This uses a package called [Nextron](https://blog.logrocket.com/building-app-next-js-electron/) to combine Electron and Next.js. All [Next.js](https://nextjs.org/) code can be found in the `/renderer` directory. Additionally, code is written in [TypeScript](https://www.typescriptlang.org/).

## Acknowledgements

