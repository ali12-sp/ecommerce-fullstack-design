import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatPublishedDate, isExternalSiteLink, resolveSiteLinkHref } from "@/lib/siteContent";
import type { BlogPost, SiteLink, SiteSettings } from "@/lib/types";
import styles from "./Footer.module.css";

const fallbackSettings: SiteSettings = {
  id: "fallback",
  brandName: "Brand",
  brandDescription:
    "A full-service B2B marketplace with live product sourcing, secure checkout, and order tracking.",
  footerBottomText: "Copyright 2026 Brand Ecommerce. All rights reserved.",
  localeLabel: "English | USD",
  socialLinks: [],
  appBadges: [],
  headerLinks: [],
  heroSlides: [],
  categoryHighlights: [],
  serviceTileImages: [],
  quoteSectionImage: "",
  footerSections: []
};

function FooterLinkItem({ link }: { link: SiteLink }) {
  const href = resolveSiteLinkHref(link);

  if (isExternalSiteLink(link)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles.footerLink}>
        {link.label}
      </a>
    );
  }

  return (
    <Link href={href} className={styles.footerLink}>
      {link.label}
    </Link>
  );
}

export async function Footer() {
  let settings = fallbackSettings;
  let blogPosts: BlogPost[] = [];

  try {
    settings = {
      ...fallbackSettings,
      ...(await apiFetch<SiteSettings>("/site-settings"))
    };
  } catch {
    settings = fallbackSettings;
  }

  try {
    blogPosts = await apiFetch<BlogPost[]>("/blog-posts?limit=2");
  } catch {
    blogPosts = [];
  }

  const brandInitial = settings.brandName?.trim()?.charAt(0)?.toUpperCase() || "B";

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.topGrid}>
          <div className={styles.brandColumn}>
            <div className={styles.brandRow}>
              <span className={styles.brandBadge}>{brandInitial}</span>
              <div>
                <strong className={styles.brandName}>{settings.brandName}</strong>
                <p className={styles.brandCopy}>{settings.brandDescription}</p>
              </div>
            </div>

            {settings.socialLinks.length > 0 ? (
              <div className={styles.socialRow}>
                {settings.socialLinks.map((social) => (
                  <a
                    key={`${social.label}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialLink}
                    aria-label={social.label}
                    title={social.label}
                  >
                    {social.label.slice(0, 2).toUpperCase()}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.contentColumns}>
            {settings.footerSections.map((section) => (
              <div key={section.title} className={styles.footerColumn}>
                <h4>{section.title}</h4>
                <div className={styles.footerLinks}>
                  {section.links.map((link) => (
                    <FooterLinkItem
                      key={`${section.title}-${link.label}-${link.value}-${link.type}`}
                      link={link}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.footerColumn}>
              <h4>From the blog</h4>
              <div className={styles.blogPreviewList}>
                {blogPosts.length > 0 ? (
                  blogPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogPreview}>
                      <strong>{post.title}</strong>
                      <span>{formatPublishedDate(post.publishedAt)}</span>
                    </Link>
                  ))
                ) : (
                  <p className={styles.emptyCopy}>Publish blog posts to feature them here.</p>
                )}
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h4>Get app</h4>
              <div className={styles.badgeList}>
                {settings.appBadges.map((badge) => (
                  <a
                    key={`${badge.label}-${badge.url}`}
                    href={badge.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.storeBadge}
                  >
                    <span>{badge.subtitle}</span>
                    <strong>{badge.label}</strong>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <span>{settings.footerBottomText}</span>
          <div className={styles.bottomMeta}>
            <Link href="/blog">Blog</Link>
            <span>{settings.localeLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
