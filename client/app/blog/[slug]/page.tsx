import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImages";
import { formatPublishedDate, splitContentBlocks } from "@/lib/siteContent";
import type { BlogPost } from "@/lib/types";
import styles from "../../editorial.module.css";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let post: BlogPost | null = null;
  let recentPosts: BlogPost[] = [];

  try {
    post = await apiFetch<BlogPost>(`/blog-posts/${params.slug}`);
    recentPosts = await apiFetch<BlogPost[]>("/blog-posts?limit=4");
  } catch {
    post = null;
    recentPosts = [];
  }

  if (!post) {
    notFound();
  }

  const relatedPosts = recentPosts.filter((item) => item.slug !== post.slug);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="breadcrumb-row">
          <Link href="/">Home</Link>
          <span>{">"}</span>
          <Link href="/blog">Blog</Link>
          <span>{">"}</span>
          <span>{post.title}</span>
        </div>

        <section className={styles.grid}>
          <article className={`card ${styles.contentCard}`}>
            <Link href="/blog" className={styles.backLink}>
              {"<"} Back to blog
            </Link>

            <div className={styles.articleCover} style={{ marginTop: 18 }}>
              <img
                src={resolveProductImage(post.coverImage, post.title)}
                alt={post.title}
              />
            </div>

            <div className={styles.metaRow}>
              <span>{formatPublishedDate(post.publishedAt)}</span>
            </div>

            <h2 style={{ fontSize: 34, lineHeight: 1.18 }}>{post.title}</h2>
            <p className={styles.excerpt}>{post.excerpt}</p>

            <div className={styles.tagRow}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className={styles.articleBody}>
              {splitContentBlocks(post.content).map((paragraph, index) => (
                <p key={`${post.id}-${index}`} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <aside className={`card ${styles.sidebarCard}`}>
            <span className={styles.kicker}>More from the blog</span>
            <h3>Recent articles</h3>
            <div className={styles.sidebarList}>
              {relatedPosts.length > 0 ? (
                relatedPosts.map((item) => (
                  <Link key={item.id} href={`/blog/${item.slug}`} className={styles.sidebarLink}>
                    <strong>{item.title}</strong>
                    <span>{formatPublishedDate(item.publishedAt)}</span>
                  </Link>
                ))
              ) : (
                <p className={styles.excerpt}>Publish more blog posts to fill this sidebar.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
