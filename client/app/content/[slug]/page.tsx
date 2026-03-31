import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { splitContentBlocks } from "@/lib/siteContent";
import type { ContentPage } from "@/lib/types";
import styles from "../../editorial.module.css";

type ContentPageProps = {
  params: {
    slug: string;
  };
};

export default async function ManagedContentPage({ params }: ContentPageProps) {
  let page: ContentPage | null = null;
  let recentPages: ContentPage[] = [];

  try {
    page = await apiFetch<ContentPage>(`/content-pages/${params.slug}`);
    recentPages = await apiFetch<ContentPage[]>("/content-pages?limit=5");
  } catch {
    page = null;
    recentPages = [];
  }

  if (!page) {
    notFound();
  }

  const relatedPages = recentPages.filter((item) => item.slug !== page.slug);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <span>{page.title}</span>
        </div>

        <section className={styles.grid}>
          <article className={`card ${styles.contentCard}`}>
            <span className={styles.kicker}>Managed content page</span>
            <h2 style={{ fontSize: 36, lineHeight: 1.14 }}>{page.title}</h2>
            <p className={styles.excerpt}>{page.summary}</p>

            <div className={styles.articleBody}>
              {splitContentBlocks(page.content).map((paragraph, index) => (
                <p key={`${page.id}-${index}`} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <aside className={`card ${styles.sidebarCard}`}>
            <span className={styles.kicker}>More information</span>
            <h3>Related pages</h3>
            <div className={styles.sidebarList}>
              {relatedPages.length > 0 ? (
                relatedPages.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.slug}`}
                    className={styles.sidebarLink}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                  </Link>
                ))
              ) : (
                <p className={styles.excerpt}>Create more content pages in the admin area.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
