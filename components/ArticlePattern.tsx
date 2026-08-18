import type { CSSProperties } from "react";
import { generateArticlePattern } from "@/lib/pattern";
import patternStyles from "./ArticlePattern.module.css";

type ArticlePatternProps = {
  seed: string;
  className?: string;
};

type SphereVars = CSSProperties & {
  "--sphere-base"?: string;
  "--sphere-highlight"?: string;
};

/**
 * 기사 제목을 시드로 한 절차적 글로시 3D 오브젝트 카드 (DESIGN.md 7장).
 * 같은 기사는 항상 같은 배경·오브젝트를 그린다.
 */
export default function ArticlePattern({ seed, className }: ArticlePatternProps) {
  const pattern = generateArticlePattern(seed);

  return (
    <div
      className={`${patternStyles.wrap}${className ? ` ${className}` : ""}`}
      style={{ background: pattern.cardBg }}
      role="presentation"
      aria-hidden="true"
    >
      {pattern.shape === "cluster"
        ? pattern.clusterDots?.map((dot, i) => (
            <span
              key={i}
              className={patternStyles.clusterDot}
              style={
                {
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: `${dot.size}%`,
                  transform: "translate(-50%, -50%)",
                  filter: dot.blurred ? "blur(3px)" : undefined,
                  "--sphere-base": pattern.baseColor,
                  "--sphere-highlight": pattern.highlightColor,
                } as SphereVars
              }
            />
          ))
        : (
            <span
              className={`${patternStyles.sphere}${pattern.shape === "ring" ? ` ${patternStyles.ring}` : ""}`}
              style={
                {
                  left: `${pattern.posX}%`,
                  top: `${pattern.posY}%`,
                  width: `${pattern.size}%`,
                  transform: `translate(-50%, -50%) rotate(${pattern.rotation}deg)`,
                  "--sphere-base": pattern.baseColor,
                  "--sphere-highlight": pattern.highlightColor,
                } as SphereVars
              }
            />
          )}
    </div>
  );
}
