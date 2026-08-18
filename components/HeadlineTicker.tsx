"use client";

import { useReducedMotion } from "framer-motion";
import type { NewsArticle } from "@/lib/utils";
import styles from "./HeadlineTicker.module.css";

type HeadlineTickerProps = {
  articles: NewsArticle[];
};

/** 랜딩 최상단 증권시세 스타일 헤드라인 티커 — 검색 실행 전에만 노출 (DESIGN.md 11장) */
export default function HeadlineTicker({ articles }: HeadlineTickerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (articles.length === 0) return null;

  if (prefersReducedMotion) {
    return (
      <div className={styles.staticList} aria-label="인기 기사">
        {articles.map((a) => (
          <a
            key={a.id}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
          >
            {a.title}
          </a>
        ))}
      </div>
    );
  }

  const track = [...articles, ...articles];

  return (
    <div className={styles.ticker} aria-label="인기 기사 티커">
      <div className={styles.track}>
        {track.map((a, i) => (
          <a
            key={`${a.id}-${i}`}
            href={a.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
          >
            {a.title}
          </a>
        ))}
      </div>
    </div>
  );
}
