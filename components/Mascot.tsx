import type { CSSProperties } from "react";

export type MascotState = "idle" | "loading" | "empty" | "error";
export type MascotPose = "spin" | "jump" | "tilt" | "bounce";

export const MASCOT_POSES: MascotPose[] = ["spin", "jump", "tilt", "bounce"];

type MascotProps = {
  state?: MascotState;
  pose?: MascotPose;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

/**
 * 로우폴리 종이비행기 심볼. 눈/코/입 없이 파츠의 회전·분산·파편화로 상태를 표현한다.
 * (DESIGN.md 4장 참고)
 */
export default function Mascot({
  state = "idle",
  pose,
  size = 64,
  className,
  style,
}: MascotProps) {
  return (
    <svg
      className={`mascot${className ? ` ${className}` : ""}`}
      data-state={state}
      data-pose={pose}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={
        state === "loading"
          ? "기사를 찾는 중"
          : state === "empty"
            ? "검색 결과 없음"
            : state === "error"
              ? "오류 발생"
              : "JNews"
      }
    >
      <g className="mascot-group">
        <polygon
          className="mascot-part mascot-part-top"
          points="95,50 10,15 55,50"
        />
        <polygon
          className="mascot-part mascot-part-bottom"
          points="95,50 55,50 10,85"
        />
        <polygon
          className="mascot-part mascot-fin"
          points="55,50 42,32 48,50"
        />
      </g>
    </svg>
  );
}
