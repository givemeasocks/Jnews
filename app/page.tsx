"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CompanionMascot from "@/components/CompanionMascot";
import HeadlineTicker from "@/components/HeadlineTicker";
import Mascot, { MASCOT_POSES, type MascotPose } from "@/components/Mascot";
import NewsCard from "@/components/NewsCard";
import StatusView from "@/components/StatusView";
import {
  CATEGORIES,
  getTodayLabel,
  type NewsArticle,
  type NewsSort,
} from "@/lib/utils";
import styles from "./page.module.css";

const PAGE_SIZE = 10;
const AUTO_LANDING_KEYWORD_POOL_SIZE = 3;
const TICKER_HEADLINE_COUNT = 8;

const CHIP_HEADINGS = [
  "요즘 이거 난리남",
  "다들 이거 보고 있어요",
  "지금 핫한 이야기",
];

// 랜딩 헤드라인 후보 — 다른 톤으로 바꾸고 싶으면 아래 중 하나로 교체
// "안 봐도 되는데, 보면 유익함"
// "뉴스는 원래 재미없는데 우리는 다름"
const LANDING_HERO_TITLE = "오늘 뭐 터졌나\n보러 왔지?";
const LANDING_HERO_SUBTITLE = "가볍게 둘러보다가, 궁금한 게 생기면 검색해보세요";

type Status = "idle" | "loading" | "empty" | "error";

type ApiSuccess = {
  items: NewsArticle[];
  total: number;
  start: number;
  display: number;
};

async function fetchNewsPage(
  query: string,
  sort: NewsSort,
  start: number,
  display: number = PAGE_SIZE
): Promise<ApiSuccess> {
  const url = `/api/news?query=${encodeURIComponent(query)}&sort=${sort}&start=${start}&display=${display}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("failed to fetch news");
  return res.json();
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<NewsSort>("sim");
  const [refineValue, setRefineValue] = useState("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [nextStart, setNextStart] = useState(1);
  const [status, setStatus] = useState<Status>("loading");
  const [isAutoLanding, setIsAutoLanding] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const [searchPulse, setSearchPulse] = useState(0);
  const [mascotPose, setMascotPose] = useState<MascotPose | undefined>(undefined);
  const [explodingQuery, setExplodingQuery] = useState<string | null>(null);
  const [chipHeading, setChipHeading] = useState(CHIP_HEADINGS[0]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const autoTriggeredRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const triggerExplosion = useCallback(
    (text: string) => {
      if (prefersReducedMotion) return;
      setExplodingQuery(text);
      window.setTimeout(() => setExplodingQuery(null), 700);
    },
    [prefersReducedMotion]
  );

  // 기본 피드는 별도 경로가 아니라 "인기 키워드로 자동 실행된 검색"일 뿐 —
  // 검색과 동일한 상태(페이지네이션/무한스크롤)를 그대로 공유한다
  const runSearch = useCallback(async (searchQuery: string, sortValue: NewsSort) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setStatus("loading");
    setRefineValue("");
    setSearchPulse((p) => p + 1);
    if (!prefersReducedMotion) {
      setMascotPose(MASCOT_POSES[Math.floor(Math.random() * MASCOT_POSES.length)]);
    }

    try {
      const data = await fetchNewsPage(trimmed, sortValue, 1);
      setArticles(data.items);
      setTotal(data.total);
      setNextStart(1 + data.items.length);
      setStatus(data.items.length === 0 ? "empty" : "idle");
    } catch {
      setStatus("error");
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;
    const pool = CATEGORIES.slice(0, AUTO_LANDING_KEYWORD_POOL_SIZE).map(
      (c) => c.label
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setInputValue(pick);
    setSort("date");
    runSearch(pick, "date");
    // 마운트 시 한 번만 실행 — runSearch/CATEGORIES는 의도적으로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsAutoLanding(false);
    triggerExplosion(trimmed);
    runSearch(trimmed, sort);
  };

  const handleChipClick = (label: string) => {
    setInputValue(label);
    setIsAutoLanding(false);
    triggerExplosion(label);
    runSearch(label, sort);
  };

  const handleSortChange = (nextSort: NewsSort) => {
    if (nextSort === sort) return;
    setSort(nextSort);
    runSearch(query, nextSort);
  };

  const handleRetry = () => runSearch(query, sort);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    if (articles.length >= total) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const data = await fetchNewsPage(query, sort, nextStart);
      setArticles((prev) => [...prev, ...data.items]);
      setNextStart((prev) => prev + data.items.length);
    } catch {
      // 추가 로드 실패는 조용히 무시 — 다음 스크롤 시 재시도
    } finally {
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [articles.length, total, query, sort, nextStart]);

  useEffect(() => {
    if (status !== "idle") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, loadMore]);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // 서버/클라이언트가 다른 랜덤값을 고르면 하이드레이션 불일치가 나므로 마운트 후에만 교체
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChipHeading(
      CHIP_HEADINGS[Math.floor(Math.random() * CHIP_HEADINGS.length)]
    );
  }, []);

  const filteredArticles = refineValue.trim()
    ? articles.filter((a) => {
        const needle = refineValue.trim();
        return a.title.includes(needle) || a.summary.includes(needle);
      })
    : articles;

  const todayLabel = getTodayLabel();
  const heroTitle = isAutoLanding ? (
    LANDING_HERO_TITLE.split("\n").map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {line}
      </span>
    ))
  ) : (
    <>
      오늘의 뉴스를,
      <br />
      매거진처럼 읽어보세요
    </>
  );
  const heroSubtitle = isAutoLanding
    ? LANDING_HERO_SUBTITLE
    : "궁금한 키워드를 검색하면 관련 기사를 모아드려요";

  return (
    <div className={styles.page}>
      {isAutoLanding && articles.length > 0 && (
        <HeadlineTicker articles={articles.slice(0, TICKER_HEADLINE_COUNT)} />
      )}

      <AnimatePresence>
        {explodingQuery && (
          <motion.div
            className={styles.explosionOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.span
              className={styles.explosionText}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {explodingQuery}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <CompanionMascot pose={mascotPose} poseKey={searchPulse} />

      <header className={`${styles.header} ${compactHeader ? styles.compact : ""}`}>
        <Mascot state="idle" size={compactHeader ? 28 : 36} />
        <span className={styles.logoTitle}>JNews</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSubtitle}>{heroSubtitle}</p>
          <form className={styles.searchForm} onSubmit={handleSubmit}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="검색어를 입력하세요"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              type="submit"
              className={`${styles.searchButton} press-scale`}
              disabled={!inputValue.trim()}
            >
              검색
            </button>
          </form>
        </div>
      </section>

      <nav id="chips" className={styles.chipSection} aria-label="인기 키워드">
        <p className={styles.chipHeading}>{chipHeading}</p>
        <div className={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              type="button"
              className={`${styles.chip} ${query === c.label ? styles.active : ""}`}
              onClick={() => handleChipClick(c.label)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </nav>

      {!isAutoLanding && (
        <div className={styles.controls}>
          <div className={styles.sortGroup}>
            <button
              type="button"
              className={`${styles.sortButton} ${sort === "sim" ? styles.active : ""}`}
              onClick={() => handleSortChange("sim")}
            >
              정확도순
            </button>
            <button
              type="button"
              className={`${styles.sortButton} ${sort === "date" ? styles.active : ""}`}
              onClick={() => handleSortChange("date")}
            >
              최신순
            </button>
            <span
              className={`${styles.sortUnderline} ${sort === "date" ? styles.second : ""}`}
            />
          </div>
          <input
            className={styles.refineInput}
            type="text"
            placeholder="결과 내 재검색"
            value={refineValue}
            onChange={(e) => setRefineValue(e.target.value)}
          />
        </div>
      )}

      <section className={styles.results}>
        {status === "loading" && <StatusView type="loading" />}

        {status === "empty" && <StatusView type="empty" query={query} />}

        {status === "error" && (
          <StatusView type="error" onRetry={handleRetry} />
        )}

        {status === "idle" && (
          <>
            <div className={styles.grid}>
              {filteredArticles.map((article, index) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  featured={index === 0 && !refineValue.trim()}
                  revealDelay={(index % PAGE_SIZE) * 40}
                  showFreshBadge={
                    sort === "date" &&
                    index === 0 &&
                    article.date === todayLabel
                  }
                />
              ))}
              {isLoadingMore &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className={styles.skeletonCard}>
                    <div className={`skeleton ${styles.skeletonImage}`} />
                    <div className={styles.skeletonLines}>
                      <div className={`skeleton ${styles.skeletonLine}`} />
                      <div className={`skeleton ${styles.skeletonLine}`} style={{ width: "70%" }} />
                    </div>
                  </div>
                ))}
            </div>
            <div ref={sentinelRef} className={styles.sentinel} />
          </>
        )}
      </section>
    </div>
  );
}
