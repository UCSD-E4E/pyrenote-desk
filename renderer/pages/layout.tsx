import Image from "next/image";
import styles from "./layout.module.css";
import { useRouter } from "next/router";

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toHome = () => {
    router.push("/home");
  };
  const toData = () => {
    router.push("/next");
  };
  const toModel = () => {
    router.push("/model");
  };
  const toLabel = () => {
    router.push("/label");
  };
  const toVerify = () => {
    router.push("/verify");
  };

  return (
    <>
      <div className="flex gap-5 p-4">
        <div className={styles.sidebar}>
          <div className={styles.icon} onClick={toHome}>
            <Image
              src="/images/home.png"
              alt="Home image"
              width={45}
              height={45}
            />
            <br />
            <span className={styles.linkStyle}>Home</span>
          </div>
          <div className={styles.icon} onClick={toData}>
            <Image
              src="/images/database.png"
              alt="Database image"
              width={45}
              height={45}
            />
            <br />
            <span className={styles.linkStyle}>Database</span>
          </div>
          <div className={styles.icon} onClick={toModel}>
            <Image
              src="/images/model.png"
              alt="Model image"
              width={45}
              height={45}
            />
            <br />
            <span className={styles.linkStyle}>Model</span>
          </div>
          <div className={styles.icon} onClick={toLabel}>
            <Image
              src="/images/tag.png"
              alt="Label image"
              width={45}
              height={45}
            />
            <br />
            <span className={styles.linkStyle}>Label</span>
          </div>
          <div className={styles.icon} onClick={toVerify}>
            <Image
              src="/images/tag.png"
              alt="Label image"
              width={45}
              height={45}
            />
            <br />
            <span className={styles.linkStyle}>Verify</span>
          </div>
        </div>
        <main>{children}</main>
      </div>
    </>
  );
}

export default Layout;
