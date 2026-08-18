const NAVY = "#06162b";
const NAVY_LIGHT = "#2b3f66";
const MUSTARD = "#e08a2c";
const CREAM = "#faf6ef";
const LIME = "#d4ff3d";
const CARD_BLACK = "#121212";

export type ObjectShape = "sphere" | "ring" | "cluster";

export type ClusterDot = {
  x: number;
  y: number;
  size: number;
  blurred: boolean;
};

export type ArticlePattern = {
  isDark: boolean;
  cardBg: string;
  shape: ObjectShape;
  baseColor: string;
  highlightColor: string;
  posX: number;
  posY: number;
  size: number;
  rotation: number;
  clusterDots?: ClusterDot[];
};

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ColorCombo = { base: string; highlight: string };

const DARK_CARD_COMBOS: ColorCombo[] = [
  { base: MUSTARD, highlight: CREAM },
  { base: CREAM, highlight: MUSTARD },
  { base: NAVY_LIGHT, highlight: CREAM },
  { base: NAVY_LIGHT, highlight: LIME },
];

const CREAM_CARD_COMBOS: ColorCombo[] = [
  { base: NAVY, highlight: CREAM },
  { base: MUSTARD, highlight: CREAM },
  { base: NAVY, highlight: LIME },
  { base: NAVY_LIGHT, highlight: MUSTARD },
];

const SHAPES: ObjectShape[] = ["sphere", "ring", "cluster"];

/**
 * 기사 제목을 시드로 결정적인(deterministic) 글로시 3D 오브젝트 카드를 생성한다.
 * careet.net 스타일의 블랙/크림 카드 + 광택 있는 구체/링/클러스터 오브젝트 (DESIGN.md 7장)
 */
export function generateArticlePattern(seed: string): ArticlePattern {
  const rand = mulberry32(hashSeed(seed));

  const isDark = rand() < 0.5;
  const cardBg = isDark ? CARD_BLACK : CREAM;
  const combos = isDark ? DARK_CARD_COMBOS : CREAM_CARD_COMBOS;
  const combo = combos[Math.floor(rand() * combos.length)];

  const shape = SHAPES[Math.floor(rand() * SHAPES.length)];
  const posX = Math.round(35 + rand() * 30);
  const posY = Math.round(35 + rand() * 25);
  const size = Math.round(58 + rand() * 24);
  const rotation = Math.round(rand() * 360);

  let clusterDots: ClusterDot[] | undefined;
  if (shape === "cluster") {
    const dotCount = 4 + Math.floor(rand() * 3);
    clusterDots = Array.from({ length: dotCount }).map((_, i) => ({
      x: Math.round(20 + rand() * 60),
      y: Math.round(20 + rand() * 60),
      size: Math.round(18 + rand() * 22),
      blurred: i % 3 === 0 && rand() < 0.6,
    }));
  }

  return {
    isDark,
    cardBg,
    shape,
    baseColor: combo.base,
    highlightColor: combo.highlight,
    posX,
    posY,
    size,
    rotation,
    clusterDots,
  };
}
