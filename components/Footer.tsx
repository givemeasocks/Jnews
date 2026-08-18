import Link from "next/link";
import Mascot from "./Mascot";
import styles from "./Footer.module.css";

/** 다크 톤 사이트 푸터 (DESIGN.md 12장) */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Mascot state="idle" size={28} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>JNews</span>
            <span className={styles.tagline}>
              매일 뉴스를 매거진처럼 읽는 가장 재밌는 방법
            </span>
          </div>
        </div>
        <nav className={styles.links} aria-label="푸터 링크">
          <Link className={styles.link} href="/">
            홈으로
          </Link>
          <a className={styles.link} href="#chips">
            인기 키워드
          </a>
        </nav>
      </div>
      <p className={styles.bottom}>&copy; {new Date().getFullYear()} JNews</p>
    </footer>
  );
}
