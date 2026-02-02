import type { AppProps } from "next/app";
import Layout from "./layout";
import "./globals.css";
import { useEffect } from "react";

const App: React.FC<AppProps> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useEffect(() => {
    const lastDbPath = localStorage.getItem('databasePath') || './databases/pyrenoteDeskDatabase.db';
    if (window.ipc) {
      window.ipc.invoke('set-db-path', lastDbPath);
      console.log("db set to last used: ", lastDbPath);
    }
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export default App;
