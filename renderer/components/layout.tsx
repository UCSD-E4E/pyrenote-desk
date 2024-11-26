import Image from "next/image";
import Link from "next/link";
import styles from "./layout.module.css";

function Layout({ children }: { children: React.ReactNode }) {
  const toHome = () => {
    window.location.href = "/home";
  };
  const toData = () => {
    window.location.href = "/next";
  };
  const toModel = () => {
    window.location.href = "/model";
  };
  const toLabel = () => {
    window.location.href = "/label";
  };

  return (
    <>
      <div className={styles.container}>
        <div>
          <div className={styles.home} onClick={toHome}>
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
        <main>{children}</main>
      </div>
    </>
  );
}

export default Layout;
