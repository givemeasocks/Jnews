"use client";

import { useEffect, useState } from "react";
import Mascot, { type MascotPose } from "./Mascot";

const MAX_OFFSET = 14;
const EASE = 0.06;

type CompanionMascotProps = {
  /** 부모가 검색 실행마다 골라주는 포즈 — 없으면(reduced motion 등) 정적으로 표시 */
  pose?: MascotPose;
  /** 값이 바뀔 때마다 마스코트를 리마운트해 포즈 애니메이션을 재생시킨다 */
  poseKey: number;
};

/** 화면 한쪽에 상시 등장하는 동반자 마스코트 — 커서 lazy-follow(데스크톱) / idle 흔들림(터치, CSS) (DESIGN.md 10.1) */
export default function CompanionMascot({ pose, poseKey }: CompanionMascotProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!hoverCapable || reducedMotion) return;

    let raf = 0;
    const current = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      target = { x: dx * MAX_OFFSET, y: dy * MAX_OFFSET };
    };

    const tick = () => {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      setOffset({ x: current.x, y: current.y });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="companion-mascot" aria-hidden="true">
      <Mascot
        key={poseKey}
        pose={pose}
        size={56}
        style={{
          transform: `translate(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px)`,
        }}
      />
    </div>
  );
}
