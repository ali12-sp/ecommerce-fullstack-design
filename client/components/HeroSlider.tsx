"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { resolveProductImage } from "@/lib/productImages";
import type { HeroSlide } from "@/lib/types";
import styles from "@/app/home.module.css";

type HeroSliderProps = {
  slides: HeroSlide[];
};

export function HeroSlider({ slides }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [slides]);

  const activeSlide = slides[activeIndex] || slides[0];

  if (!activeSlide) {
    return null;
  }

  const bannerStyle = {
    "--hero-banner-image": `url("${resolveProductImage(activeSlide.image, activeSlide.title)}")`
  } as CSSProperties;

  return (
    <div className={styles.heroBanner} style={bannerStyle}>
      <div className={styles.heroContent}>
        <span className={styles.heroEyebrow}>{activeSlide.eyebrow}</span>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.description}</p>

        <div className={styles.heroActions}>
          <Link href={activeSlide.ctaHref || "/products"} className="btn-primary">
            {activeSlide.ctaLabel || "Explore"}
          </Link>
          <Link href="/products" className="btn-light">
            Browse catalog
          </Link>
        </div>
      </div>

      {slides.length > 1 ? (
        <div className={styles.heroDots}>
          {slides.map((slide, index) => (
            <button
              key={`${slide.title}-${index}`}
              type="button"
              className={index === activeIndex ? styles.heroDotActive : styles.heroDot}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
