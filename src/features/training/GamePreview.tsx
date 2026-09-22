"use client";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useApp } from "../../storage/store";

export default function GamePreview({
  scenario,
  dimension,
  children,
  eager = false,
}: {
  scenario: string;
  dimension: string;
  children?: ReactNode;
  eager?: boolean;
}) {
  const { t } = useTranslation();
  const reducedMotion = useApp((state) => state.db.settings.reducedMotion);
  const viewport = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const show = (index: number) => {
    const target = (index + 2) % 2;
    viewport.current?.scrollTo({
      left: target * viewport.current.clientWidth,
      behavior:
        reducedMotion ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
    });
  };
  return (
    <div
      className="game-preview"
      role="group"
      aria-label={t("gallery-label", { scenario: t(scenario) })}
      aria-roledescription={t("gallery-carousel")}
      data-slide={current}
    >
      <div
        ref={viewport}
        className="game-preview-track"
        tabIndex={0}
        aria-label={t("gallery-label", { scenario: t(scenario) })}
        onScroll={(event) => {
          const element = event.currentTarget;
          setCurrent(
            Math.round(element.scrollLeft / Math.max(1, element.clientWidth)),
          );
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            show(current + (event.key === "ArrowLeft" ? -1 : 1));
          }
        }}
      >
        {[1, 2].map((number) => (
          <img
            key={number}
            src={`/training/${scenario}-${number}.jpg`}
            alt={t("gallery-image", { scenario: t(scenario), index: number })}
            width={1018}
            height={637}
            loading={eager && number === 1 ? "eager" : "lazy"}
            fetchPriority={eager && number === 1 ? "high" : "auto"}
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
      <div className="game-preview-shade" aria-hidden="true" />
      <span className="game-dimension">{dimension.toUpperCase()}</span>
      <div className="game-preview-favorite">{children}</div>
      <button
        type="button"
        className="gallery-arrow previous"
        onClick={() => show(current - 1)}
        aria-label={t("gallery-previous", { scenario: t(scenario) })}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        className="gallery-arrow next"
        onClick={() => show(current + 1)}
        aria-label={t("gallery-next", { scenario: t(scenario) })}
      >
        <ChevronRight size={18} />
      </button>
      <div className="gallery-footer">
        <span className="gallery-caption">
          <Images size={13} aria-hidden="true" />
          {t("gallery-gameplay")}
        </span>
        <div className="gallery-dots">
          {[0, 1].map((index) => (
            <button
              type="button"
              key={index}
              className={current === index ? "selected" : ""}
              aria-label={t("gallery-show", {
                index: index + 1,
                scenario: t(scenario),
              })}
              aria-pressed={current === index}
              onClick={() => show(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <span className="gallery-count" aria-hidden="true">
          {current + 1} / 2
        </span>
      </div>
    </div>
  );
}
