import type { UnsplashPhoto } from "./unsplash";

export type Category = {
  label: string;
};

export const CATEGORIES: Category[] = [
  { label: "정치" },
  { label: "경제" },
  { label: "사회" },
  { label: "생활문화" },
  { label: "IT/과학" },
  { label: "세계" },
  { label: "스포츠" },
  { label: "연예" },
];

const CATEGORY_BY_LABEL = new Map(CATEGORIES.map((c) => [c.label, c]));

/** 검색어가 고정 카테고리 칩과 정확히 일치하면 해당 카테고리를 반환 */
export function getCategoryForQuery(query: string): Category | null {
  return CATEGORY_BY_LABEL.get(query.trim()) ?? null;
}

/** 검색어가 카테고리와 매칭되지 않을 때, 카드 순서에 따라 대표 이미지를 순환 배정 */
export function getCategoryByIndex(index: number): Category {
  return CATEGORIES[index % CATEGORIES.length];
}

const HTML_ENTITY_MAP: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&quot;|&apos;|&#39;|&amp;|&lt;|&gt;|&nbsp;/g,
    (entity) => HTML_ENTITY_MAP[entity] ?? entity
  );
}

function stripHtmlTags(text: string): string {
  return text.replace(/<\/?[a-z][^>]*>/gi, "");
}

/** 네이버 API 응답의 title/description 정제: 태그 제거 + 엔티티 디코딩 */
export function cleanText(text: string): string {
  return decodeHtmlEntities(stripHtmlTags(text)).trim();
}

/** RFC 822 형식(pubDate)을 한국식 날짜 포맷으로 변환 (예: 2026년 8월 18일) */
export function formatKoreanDate(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return pubDate;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 오늘 날짜를 같은 포맷으로 반환 — "방금" 배지 판별에 사용 */
export function getTodayLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
}

export type NaverNewsRawItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

export type NaverNewsResponse = {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsRawItem[];
};

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  date: string;
  categoryLabel: string;
  photo?: UnsplashPhoto | null;
};

export type NewsSort = "sim" | "date";

type CacheEntry = {
  expiresAt: number;
  data: NaverNewsResponse;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const newsCache = new Map<string, CacheEntry>();

function extractSource(originalLink: string): string {
  try {
    const host = new URL(originalLink).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "";
  }
}

export async function fetchNaverNews(params: {
  query: string;
  sort: NewsSort;
  start: number;
  display: number;
}): Promise<{ items: NewsArticle[]; total: number }> {
  const { query, sort, start, display } = params;
  const cacheKey = `${query}|${sort}|${start}|${display}`;
  const cached = newsCache.get(cacheKey);
  const now = Date.now();

  let raw: NaverNewsResponse;
  if (cached && cached.expiresAt > now) {
    raw = cached.data;
  } else {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("NAVER_API_CREDENTIALS_MISSING");
    }

    const url = new URL("https://naverapihub.apigw.ntruss.com/search/v1/news");
    url.searchParams.set("query", query);
    url.searchParams.set("sort", sort);
    url.searchParams.set("start", String(start));
    url.searchParams.set("display", String(display));

    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`NAVER_API_ERROR_${res.status}`);
    }

    raw = (await res.json()) as NaverNewsResponse;
    newsCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: raw });
  }

  const matchedCategory = getCategoryForQuery(query);

  const items: NewsArticle[] = raw.items.map((item, index) => {
    const category = matchedCategory ?? getCategoryByIndex(start - 1 + index);
    return {
      id: `${start + index}-${item.link}`,
      title: cleanText(item.title),
      summary: cleanText(item.description),
      link: item.originallink || item.link,
      source: extractSource(item.originallink || item.link),
      date: formatKoreanDate(item.pubDate),
      categoryLabel: category.label,
    };
  });

  return { items, total: raw.total };
}
