const CATEGORY_EN: Record<string, string> = {
  정치: "politics",
  경제: "economy",
  사회: "society",
  생활문화: "culture",
  "IT/과학": "technology",
  세계: "world",
  스포츠: "sports",
  연예: "entertainment",
};

const PARTICLE_SUFFIXES = [
  "에서",
  "으로",
  "이라",
  "라는",
  "하는",
  "했다",
  "는",
  "은",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "로",
  "과",
  "와",
  "도",
  "만",
];

function stripParticle(word: string): string {
  for (const suffix of PARTICLE_SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** 기사 제목에서 조사/특수문자를 제거하고 가장 긴 단어 하나를 뽑는 간단한 휴리스틱 */
function extractKeyword(title: string): string {
  const cleaned = title.replace(/[^가-힣a-zA-Z0-9\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return "";

  const stripped = tokens.map(stripParticle).filter((t) => t.length >= 2);
  const pool = stripped.length > 0 ? stripped : tokens;

  return pool.reduce((longest, t) => (t.length > longest.length ? t : longest), pool[0]);
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export type UnsplashPhoto = {
  url: string;
  creditName: string;
  creditUrl: string;
};

type UnsplashApiPhoto = {
  urls?: { regular?: string; small?: string };
  user?: { name?: string; links?: { html?: string } };
};

type UnsplashApiResponse = {
  results?: UnsplashApiPhoto[];
};

type CachedResults = {
  expiresAt: number;
  photos: UnsplashPhoto[];
};

const PHOTO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const searchCache = new Map<string, CachedResults>();

async function searchUnsplash(query: string): Promise<UnsplashPhoto[]> {
  const cached = searchCache.get(query);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.photos;

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("orientation", "landscape");

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    // 실패/한도초과도 캐싱해 동일 요청이 계속 API를 두드리지 않게 함 — 폴백은 호출부에서 처리
    searchCache.set(query, { expiresAt: now + PHOTO_CACHE_TTL_MS, photos: [] });
    return [];
  }

  const data = (await res.json()) as UnsplashApiResponse;
  const photos: UnsplashPhoto[] = (data.results ?? [])
    .map((r) => ({
      url: r.urls?.regular ?? r.urls?.small ?? "",
      creditName: r.user?.name ?? "Unsplash",
      creditUrl: r.user?.links?.html ?? "https://unsplash.com",
    }))
    .filter((p) => p.url.length > 0);

  searchCache.set(query, { expiresAt: now + PHOTO_CACHE_TTL_MS, photos });
  return photos;
}

/**
 * 기사 카테고리+제목으로 Unsplash 사진을 찾는다. 키를 못 찾거나 API 실패/결과 없음이면 null —
 * 호출부(NewsCard)는 null일 때 7장의 절차적 글로시 오브젝트로 폴백한다.
 */
export async function fetchArticlePhoto(
  categoryLabel: string,
  title: string
): Promise<UnsplashPhoto | null> {
  try {
    const categoryEn = CATEGORY_EN[categoryLabel] ?? "news";
    const keyword = extractKeyword(title);
    const query = keyword ? `${categoryEn} ${keyword}` : categoryEn;

    const photos = await searchUnsplash(query);
    if (photos.length === 0) return null;

    const index = hashSeed(title) % photos.length;
    return photos[index];
  } catch {
    return null;
  }
}
