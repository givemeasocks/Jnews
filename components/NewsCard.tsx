"use client";

import { useEffect, useState } from "react";
import type { NewsArticle } from "@/lib/utils";
import { generateArticlePattern } from "@/lib/pattern";
import ArticlePattern from "./ArticlePattern";
import styles from "./NewsCard.module.css";

type NewsCardProps = {
  article: NewsArticle;
  featured?: boolean;
  revealDelay?: number;
  showFreshBadge?: boolean;
};

export default function NewsCard({
  article,
  featured = false,
  revealDelay = 0,
  showFreshBadge = false,
}: NewsCardProps) {
  const [open, setOpen] = useState(false);
  const hasPhoto = Boolean(article.photo);
  const pattern = generateArticlePattern(article.title);
  const isDark = hasPhoto ? true : pattern.isDark;
  const textColor = isDark ? "var(--color-cream)" : "var(--color-text)";
  const captionColor = isDark
    ? "rgba(250, 246, 239, 0.6)"
    : "var(--color-text-muted)";
  const dividerColor = isDark
    ? "rgba(250, 246, 239, 0.18)"
    : "var(--color-border)";

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <article
        className={`${styles.card} ${featured ? `${styles.featured} featured` : ""} reveal`}
        style={{ animationDelay: `${revealDelay}ms` }}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <div className={styles.objectLayer}>
          {article.photo ? (
            <img
              src={article.photo.url}
              alt=""
              className={styles.photoImage}
              loading="lazy"
            />
          ) : (
            <ArticlePattern seed={article.title} />
          )}
        </div>

        {hasPhoto && <div className={styles.photoScrim} />}

        <div className={styles.textZone}>
          <div className={styles.captionRow}>
            <span className={styles.caption} style={{ color: captionColor }}>
              {article.categoryLabel}
            </span>
            {showFreshBadge && <span className={styles.freshTag}>· 방금</span>}
          </div>
          <div className={styles.divider} style={{ background: dividerColor }} />
          <h3 className={styles.title} style={{ color: textColor }}>
            {article.title}
          </h3>
        </div>

        <span className={styles.arrowButton} aria-hidden="true">
          ↗
        </span>
      </article>

      {open && (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalImageWrap}>
              {article.photo ? (
                <img
                  src={article.photo.url}
                  alt=""
                  className={styles.modalPhotoImage}
                />
              ) : (
                <ArticlePattern seed={article.title} />
              )}
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
              <span className={styles.modalCaption}>{article.categoryLabel}</span>
              {article.photo && (
                <a
                  href={article.photo.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.photoCredit}
                  onClick={(e) => e.stopPropagation()}
                >
                  Photo by {article.photo.creditName} on Unsplash
                </a>
              )}
            </div>
            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>{article.title}</h2>
              <p className={styles.modalSummary}>{article.summary}</p>
              <div className={styles.modalMeta}>
                {article.source && <span>{article.source} · </span>}
                <span>{article.date}</span>
              </div>
              <div className={styles.modalActions}>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.originalLinkButton} press-scale`}
                >
                  원문 보기
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
