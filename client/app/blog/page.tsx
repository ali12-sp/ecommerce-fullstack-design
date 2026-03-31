import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImages";
import { formatPublishedDate } from "@/lib/siteContent";
import type { BlogPost } from "@/lib/types";
import styles from "../editorial.module.css";

export default async function BlogPage() {
  let posts: BlogPost[] = [];

  try {
    posts = await apiFetch<BlogPost[]>("/blog-posts");
  } catch {
    posts = [];
  }

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className={styles.page}>
      <div className="container">
        <section className={styles.hero}>
          <span className={styles.kicker}>Marketplace blog</span>
          <h1>Live articles managed from the same system as your footer and storefront.</h1>
          <p>
            Blog content is now part of the project itself, so your footer can link to a working
            destination and your admin area can manage articles without hardcoded JSX.
          </p>
        </section>

        {featuredPost ? (
          <section className={styles.grid}>
            <Link href={`/blog/${featuredPost.slug}`} className={`card ${styles.contentCard}`}>
              <div className={styles.articleCover}>
                <img
                  src={resolveProductImage(featuredPost.coverImage, featuredPost.title)}
                  alt={featuredPost.title}
                />
              </div>

              <div className={styles.metaRow}>
                <span>{formatPublishedDate(featuredPost.publishedAt)}</span>
                <span>{featuredPost.tags.join(" • ")}</span>
              </div>

              <h2>{featuredPost.title}</h2>
              <p className={styles.excerpt}>{featuredPost.excerpt}</p>
            </Link>

            <aside className={`card ${styles.sidebarCard}`}>
              <span className={styles.kicker}>Recent posts</span>
              <h3>Read the latest marketplace updates</h3>
              <div className={styles.sidebarList}>
                {remainingPosts.length > 0 ? (
                  remainingPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className={styles.sidebarLink}>
                      <strong>{post.title}</strong>
                      <span>{formatPublishedDate(post.publishedAt)}</span>
                    </Link>
                  ))
                ) : (
                  <p className={styles.excerpt}>Create more articles in the admin content area.</p>
                )}
              </div>
            </aside>
          </section>
        ) : (
          <div className={styles.emptyState}>No blog posts are published yet.</div>
        )}

        {remainingPosts.length > 0 ? (
          <section style={{ marginTop: 24 }}>
            <div className={styles.postGrid}>
              {remainingPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className={styles.postCard}>
                  <div className={styles.postImage}>
                    <img
                      src={resolveProductImage(post.coverImage, post.title)}
                      alt={post.title}
                    />
                  </div>

                  <div className={styles.postBody}>
                    <div className={styles.metaRow}>
                      <span>{formatPublishedDate(post.publishedAt)}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p className={styles.excerpt}>{post.excerpt}</p>
                    <div className={styles.tagRow}>
                      {post.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
