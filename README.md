# Pyrenote Desktop

## Setup

We are using `yarn` for this application! Please install `yarn` with `npm install -g yarn` ([tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-the-yarn-package-manager-for-node-js)).

Enter `yarn && yarn dev` into the terminal, and the application should install all your dependencies and open up a new electron window!

## Development

This uses a package called [Nextron](https://blog.logrocket.com/building-app-next-js-electron/) to combine Electron and Next.js. All [Next.js](https://nextjs.org/) code can be found in the `/renderer` directory. Additionally, all code is written in [TypeScript](https://www.typescriptlang.org/).

### My Edits
Previously, I was using sql.js, which creates databases that don't persist. To counteract that, I tried to export the file information after each session, which works for small datasets but is likely not scalable. Hence, I moved away from sql.js, and, instead, did "yarn add better-sqlite3" which autosaves information into a persisting database. This, in turn, changed the following files: 
- main/background.ts
- main/preload.js
- main/preload.ts
- renderer/pages/next.tsx
- packages.json (due to the yarn add command mentioned above)
- yarn.lock (due to the yarn add command mentioned above)

Now, I added a button where the user can upload a csv and the code parses it and uploads it into the Labeler table of the database.