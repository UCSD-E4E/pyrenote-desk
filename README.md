# Pyrenote Desktop

## Setup

We are using `yarn` for this application! Please install `yarn` with `npm install -g yarn` ([tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-the-yarn-package-manager-for-node-js)).

Enter `yarn && yarn dev` into the terminal, and the application should install all your dependencies and open up a new electron window!

## Development

This uses a package called [Nextron](https://blog.logrocket.com/building-app-next-js-electron/) to combine Electron and Next.js. All [Next.js](https://nextjs.org/) code can be found in the `/renderer` directory. Additionally, all code is written in [TypeScript](https://www.typescriptlang.org/).

### My Edits
My goal was to store the user's name and email into the "Labeler" table of the database.

I looked at package.json and saw that we are using sql.js. I imported the schema from "magnus.sqlite.sql" and created the database, based off of that schema using SQL.js in the "background.ts" file. This database is an in-memory database. 

The next issue was writing functions that allowed the renderer to interact with the database. Since the renderer process cannot directly access the database, I implemented IPC (Inter-Process Communication) to allow communication between the renderer and the main process. I set up IPC request handlers in background.ts, preload.d.ts, and preload.js, which expose endpoints that allow the renderer to send queries to the database. These endpoints are then called in next.tsx to insert and retrieve data from the Labeler table.

As of now, I successfully added a user’s name and email from the next.tsx page and verified that the data was correctly inserted into the database; however, I created that database using SQL.js, so the way that I made it persist is by saving it into a new variable, editing that variable, and then resaving that variable into the db. This is probably not scalable for larger datasets.
