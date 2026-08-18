"use client";

import Mascot from "./Mascot";
import styles from "./StatusView.module.css";

type StatusViewProps =
  | { type: "loading" }
  | { type: "empty"; query?: string }
  | { type: "error"; onRetry: () => void };

export default function StatusView(props: StatusViewProps) {
  if (props.type === "loading") {
    return (
      <div className={styles.wrap}>
        <Mascot state="loading" size={80} />
        <p className={styles.message}>기사를 찾는 중이에요</p>
      </div>
    );
  }

  if (props.type === "empty") {
    return (
      <div className={styles.wrap}>
        <Mascot state="empty" size={80} />
        <p className={styles.message}>이 키워드로는 아직 소식이 없네요</p>
        <p className={styles.subMessage}>다른 검색어로 다시 찾아볼까요?</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <Mascot state="error" size={80} />
      <p className={styles.message}>잠시 문제가 생겼어요, 다시 시도해주세요</p>
      <button
        type="button"
        className={`${styles.retryButton} press-scale`}
        onClick={props.onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}
