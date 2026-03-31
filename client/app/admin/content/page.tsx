"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAuthHeaders } from "@/lib/api";
import { resolveProductImage } from "@/lib/productImages";
import type {
  AppBadge,
  BlogPost,
  CategoryHighlight,
  ContentPage,
  FooterSection,
  HeroSlide,
  SiteLink,
  SiteLinkType,
  SiteSettings,
  SocialLink
} from "@/lib/types";
import { useApp } from "@/context/AppContext";
import styles from "./content.module.css";

type SiteSettingsForm = Omit<SiteSettings, "id">;

type ContentPageForm = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
};

type BlogPostForm = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  tags: string;
  status: "draft" | "published";
  publishedAt: string;
};

type UploadResponse = {
  imagePath: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const serviceTileLabels = [
  "Source from Industry Hubs",
  "Customize Supplier Requests",
  "Fast, Verified Shipping",
  "Product Monitoring and Inspecting"
];

const blankSettings: SiteSettingsForm = {
  brandName: "",
  brandDescription: "",
  footerBottomText: "",
  localeLabel: "",
  socialLinks: [],
  appBadges: [],
  headerLinks: [],
  heroSlides: [],
  categoryHighlights: [],
  serviceTileImages: [],
  quoteSectionImage: "",
  footerSections: []
};

const blankContentPage: ContentPageForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  status: "published"
};

const blankBlogPost: BlogPostForm = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "/products/placeholder.svg",
  content: "",
  tags: "",
  status: "published",
  publishedAt: new Date().toISOString().slice(0, 16)
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image file"));
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function toDateTimeLocalValue(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 16);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function newSocialLink(): SocialLink {
  return { label: "", url: "" };
}

function newAppBadge(): AppBadge {
  return { label: "", subtitle: "", url: "" };
}

function newFooterLink(): SiteLink {
  return { label: "", type: "route", value: "", openInNewTab: false };
}

function newFooterSection(): FooterSection {
  return { title: "", links: [newFooterLink()] };
}

function newHeroSlide(): HeroSlide {
  return {
    eyebrow: "",
    title: "",
    description: "",
    image: "/products/placeholder.svg",
    ctaLabel: "",
    ctaHref: "/products"
  };
}

function newCategoryHighlight(): CategoryHighlight {
  return {
    category: "",
    image: "/products/placeholder.svg"
  };
}

function mapSiteSettingsToForm(siteSettings: SiteSettings | SiteSettingsForm): SiteSettingsForm {
  return {
    brandName: siteSettings.brandName,
    brandDescription: siteSettings.brandDescription,
    footerBottomText: siteSettings.footerBottomText,
    localeLabel: siteSettings.localeLabel,
    socialLinks: siteSettings.socialLinks || [],
    appBadges: siteSettings.appBadges || [],
    headerLinks: siteSettings.headerLinks || [],
    heroSlides: siteSettings.heroSlides || [],
    categoryHighlights: siteSettings.categoryHighlights || [],
    serviceTileImages: siteSettings.serviceTileImages || [],
    quoteSectionImage: siteSettings.quoteSectionImage || "",
    footerSections: siteSettings.footerSections || []
  };
}

export default function AdminContentPage() {
  const router = useRouter();
  const { auth, isHydrated } = useApp();
  const isAdmin = auth.user?.role === "admin";

  const [settings, setSettings] = useState<SiteSettingsForm>(blankSettings);
  const [savedSettings, setSavedSettings] = useState<SiteSettingsForm>(blankSettings);
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pageForm, setPageForm] = useState<ContentPageForm>(blankContentPage);
  const [blogForm, setBlogForm] = useState<BlogPostForm>(blankBlogPost);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSettingsLabel, setSavingSettingsLabel] = useState("");
  const [savingPage, setSavingPage] = useState(false);
  const [savingBlog, setSavingBlog] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [blogError, setBlogError] = useState("");
  const [blogMessage, setBlogMessage] = useState("");

  useEffect(() => {
    if (!isHydrated) return;

    if (!auth.user) {
      router.replace("/auth/login?redirect=/admin/content");
      return;
    }

    if (!isAdmin) {
      router.replace("/");
    }
  }, [auth.user, isAdmin, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated || !isAdmin || !auth.token) return;

    async function loadData() {
      try {
        setLoading(true);
        const [siteSettings, pages, posts] = await Promise.all([
          apiFetch<SiteSettings>("/site-settings"),
          apiFetch<ContentPage[]>("/admin/content-pages", {
            headers: getAuthHeaders(auth.token)
          }),
          apiFetch<BlogPost[]>("/admin/blog-posts", {
            headers: getAuthHeaders(auth.token)
          })
        ]);

        const nextSettings = mapSiteSettingsToForm(siteSettings);
        setSettings(nextSettings);
        setSavedSettings(nextSettings);
        setContentPages(pages);
        setBlogPosts(posts);
      } catch (error: any) {
        setSettingsError(error?.message || "Failed to load content system");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [auth.token, isAdmin, isHydrated]);

  function resetPageForm() {
    setPageForm(blankContentPage);
    setEditingPageId(null);
  }

  function resetBlogForm() {
    setBlogForm(blankBlogPost);
    setEditingBlogId(null);
  }

  function updateSocialLink(index: number, key: keyof SocialLink, value: string) {
    setSettings((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateAppBadge(index: number, key: keyof AppBadge, value: string) {
    setSettings((current) => ({
      ...current,
      appBadges: current.appBadges.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateFooterSection(index: number, value: string) {
    setSettings((current) => ({
      ...current,
      footerSections: current.footerSections.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title: value } : item
      )
    }));
  }

  function updateHeaderLink(index: number, key: keyof SiteLink, value: string | boolean) {
    setSettings((current) => ({
      ...current,
      headerLinks: current.headerLinks.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateHeroSlide(
    index: number,
    key: keyof HeroSlide,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      heroSlides: current.heroSlides.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateCategoryHighlight(
    index: number,
    key: keyof CategoryHighlight,
    value: string
  ) {
    setSettings((current) => ({
      ...current,
      categoryHighlights: current.categoryHighlights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    }));
  }

  function updateServiceTileImage(index: number, value: string) {
    setSettings((current) => {
      const serviceTileImages = [...current.serviceTileImages];
      serviceTileImages[index] = value;

      return {
        ...current,
        serviceTileImages
      };
    });
  }

  function updateFooterLink(
    sectionIndex: number,
    linkIndex: number,
    key: keyof SiteLink,
    value: string | boolean
  ) {
    setSettings((current) => ({
      ...current,
      footerSections: current.footerSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              links: section.links.map((link, currentLinkIndex) =>
                currentLinkIndex === linkIndex ? { ...link, [key]: value } : link
              )
            }
          : section
      )
    }));
  }

  async function persistSettings(
    keys?: Array<keyof SiteSettingsForm>,
    successMessage = "Site settings saved successfully.",
    saveLabel = "Save site settings"
  ) {
    if (!auth.token) {
      setSettingsError("Admin token is missing");
      return;
    }

    try {
      setSavingSettings(true);
      setSavingSettingsLabel(saveLabel);
      setSettingsError("");
      setSettingsMessage("");

      const payload = keys?.length
        ? keys.reduce<SiteSettingsForm>(
            (currentPayload, key) => ({
              ...currentPayload,
              [key]: settings[key]
            }),
            { ...savedSettings }
          )
        : settings;

      const updated = await apiFetch<SiteSettings>("/site-settings", {
        method: "PUT",
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify(payload)
      });

      const nextSettings = mapSiteSettingsToForm(updated);
      setSavedSettings(nextSettings);
      setSettings((current) =>
        keys?.length
          ? keys.reduce<SiteSettingsForm>(
              (currentSettings, key) => ({
                ...currentSettings,
                [key]: nextSettings[key]
              }),
              { ...current }
            )
          : nextSettings
      );
      setSettingsMessage(successMessage);
    } catch (error: any) {
      setSettingsError(error?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
      setSavingSettingsLabel("");
    }
  }

  async function saveContentPage(event: FormEvent) {
    event.preventDefault();

    if (!auth.token) {
      setPageError("Admin token is missing");
      return;
    }

    try {
      setSavingPage(true);
      setPageError("");
      setPageMessage("");

      const saved = await apiFetch<ContentPage>(
        editingPageId ? `/admin/content-pages/${editingPageId}` : "/admin/content-pages",
        {
          method: editingPageId ? "PUT" : "POST",
          headers: getAuthHeaders(auth.token),
          body: JSON.stringify(pageForm)
        }
      );

      setContentPages((current) =>
        editingPageId
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );

      resetPageForm();
      setPageMessage("Content page saved successfully.");
    } catch (error: any) {
      setPageError(error?.message || "Failed to save content page");
    } finally {
      setSavingPage(false);
    }
  }

  async function saveBlogPost(event: FormEvent) {
    event.preventDefault();

    if (!auth.token) {
      setBlogError("Admin token is missing");
      return;
    }

    try {
      setSavingBlog(true);
      setBlogError("");
      setBlogMessage("");

      const saved = await apiFetch<BlogPost>(
        editingBlogId ? `/admin/blog-posts/${editingBlogId}` : "/admin/blog-posts",
        {
          method: editingBlogId ? "PUT" : "POST",
          headers: getAuthHeaders(auth.token),
          body: JSON.stringify(blogForm)
        }
      );

      setBlogPosts((current) =>
        editingBlogId
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );

      resetBlogForm();
      setBlogMessage("Blog post saved successfully.");
    } catch (error: any) {
      setBlogError(error?.message || "Failed to save blog post");
    } finally {
      setSavingBlog(false);
    }
  }

  async function uploadImageAsset(file: File) {
    if (!auth.token) {
      throw new Error("Admin token is missing");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose a valid image file");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image must be 5 MB or smaller");
    }

    const data = await readFileAsDataUrl(file);
    const response = await apiFetch<UploadResponse>("/uploads", {
      method: "POST",
      headers: getAuthHeaders(auth.token),
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        data
      })
    });

    return response.imagePath;
  }

  async function uploadCoverImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setBlogError("");
      const imagePath = await uploadImageAsset(file);
      setBlogForm((current) => ({ ...current, coverImage: imagePath }));
    } catch (error: any) {
      setBlogError(error?.message || "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function uploadHeroSlideImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setSettingsError("");
      setSettingsMessage("");
      const imagePath = await uploadImageAsset(file);
      updateHeroSlide(index, "image", imagePath);
      setSettingsMessage("Hero slide image uploaded. Save homepage hero slides to publish it.");
    } catch (error: any) {
      setSettingsError(error?.message || "Failed to upload hero slide image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function uploadCategoryHighlightImage(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setSettingsError("");
      setSettingsMessage("");
      const imagePath = await uploadImageAsset(file);
      updateCategoryHighlight(index, "image", imagePath);
      setSettingsMessage("Category image uploaded. Save category card images to publish it.");
    } catch (error: any) {
      setSettingsError(error?.message || "Failed to upload category image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function uploadServiceTileImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setSettingsError("");
      setSettingsMessage("");
      const imagePath = await uploadImageAsset(file);
      updateServiceTileImage(index, imagePath);
      setSettingsMessage(
        "Service tile image uploaded. Save service tile backgrounds to publish it."
      );
    } catch (error: any) {
      setSettingsError(error?.message || "Failed to upload service tile image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function uploadQuoteSectionImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploadingCover(true);
      setSettingsError("");
      setSettingsMessage("");
      const imagePath = await uploadImageAsset(file);
      setSettings((current) => ({ ...current, quoteSectionImage: imagePath }));
      setSettingsMessage("Quote section image uploaded. Save quote section background to publish it.");
    } catch (error: any) {
      setSettingsError(error?.message || "Failed to upload quote section image");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  function getSaveButtonText(label: string) {
    return savingSettings && savingSettingsLabel === label ? "Saving..." : label;
  }

  async function removeContentPage(id: string) {
    if (!auth.token) return;
    if (!window.confirm("Delete this content page?")) return;

    try {
      await apiFetch(`/admin/content-pages/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(auth.token)
      });
      setContentPages((current) => current.filter((item) => item.id !== id));

      if (editingPageId === id) {
        resetPageForm();
      }
    } catch (error: any) {
      setPageError(error?.message || "Failed to delete content page");
    }
  }

  async function removeBlogPost(id: string) {
    if (!auth.token) return;
    if (!window.confirm("Delete this blog post?")) return;

    try {
      await apiFetch(`/admin/blog-posts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(auth.token)
      });
      setBlogPosts((current) => current.filter((item) => item.id !== id));

      if (editingBlogId === id) {
        resetBlogForm();
      }
    } catch (error: any) {
      setBlogError(error?.message || "Failed to delete blog post");
    }
  }

  if (!isHydrated || !auth.user || !isAdmin) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        Checking admin access...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.tabs}>
          <Link href="/admin/products" className={styles.tab}>
            Products
          </Link>
          <Link href="/orders" className={styles.tab}>
            Orders
          </Link>
          <span className={`${styles.tab} ${styles.tabActive}`}>Content</span>
        </div>

        {loading ? <p>Loading content system...</p> : null}

        <div className={styles.layout}>
          <section className={`card ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h1>Site settings</h1>
                <p>Manage homepage visuals, footer content, and save each section directly after you edit it.</p>
              </div>
            </div>

            <div className={styles.form}>
              {settingsError ? <p className={styles.error}>{settingsError}</p> : null}
              {settingsMessage ? <p className={styles.success}>{settingsMessage}</p> : null}

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Brand basics</h2>
                </div>

                <div className={styles.stack}>
                  <input
                    placeholder="Brand name"
                    value={settings.brandName}
                    onChange={(e) =>
                      setSettings((current) => ({ ...current, brandName: e.target.value }))
                    }
                  />
                  <textarea
                    placeholder="Brand description"
                    value={settings.brandDescription}
                    onChange={(e) =>
                      setSettings((current) => ({ ...current, brandDescription: e.target.value }))
                    }
                  />
                  <input
                    placeholder="Footer bottom text"
                    value={settings.footerBottomText}
                    onChange={(e) =>
                      setSettings((current) => ({ ...current, footerBottomText: e.target.value }))
                    }
                  />
                  <input
                    placeholder="Locale label"
                    value={settings.localeLabel}
                    onChange={(e) =>
                      setSettings((current) => ({ ...current, localeLabel: e.target.value }))
                    }
                  />
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["brandName", "brandDescription", "footerBottomText", "localeLabel"],
                        "Brand basics saved successfully.",
                        "Save brand basics"
                      )
                    }
                    disabled={savingSettings}
                  >
                    {getSaveButtonText("Save brand basics")}
                  </button>
                </div>
              </div>
              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Header links</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        headerLinks: [...current.headerLinks, newFooterLink()]
                      }))
                    }
                  >
                    Add header link
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.headerLinks.map((link, index) => (
                    <div key={`header-link-${index}`} className={styles.linkEditor}>
                      <input
                        placeholder="Link label"
                        value={link.label}
                        onChange={(e) => updateHeaderLink(index, "label", e.target.value)}
                      />
                      <select
                        value={link.type}
                        onChange={(e) =>
                          updateHeaderLink(index, "type", e.target.value as SiteLinkType)
                        }
                      >
                        <option value="route">Route</option>
                        <option value="content">Content page</option>
                        <option value="blog_index">Blog index</option>
                        <option value="blog_post">Blog post</option>
                        <option value="external">External URL</option>
                      </select>
                      <input
                        placeholder="Value or slug"
                        value={link.value}
                        onChange={(e) => updateHeaderLink(index, "value", e.target.value)}
                      />
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={link.openInNewTab}
                          onChange={(e) =>
                            updateHeaderLink(index, "openInNewTab", e.target.checked)
                          }
                        />
                        New tab
                      </label>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            headerLinks: current.headerLinks.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        Remove link
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["headerLinks"],
                        "Header links saved successfully.",
                        "Save header links"
                      )
                    }
                    disabled={savingSettings}
                  >
                    {getSaveButtonText("Save header links")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Homepage hero slides</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        heroSlides: [...current.heroSlides, newHeroSlide()]
                      }))
                    }
                  >
                    Add hero slide
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.heroSlides.map((slide, index) => (
                    <div key={`hero-slide-${index}`} className={styles.blockCard}>
                      <div className={styles.groupHeader}>
                        <h2>Slide {index + 1}</h2>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() =>
                            setSettings((current) => ({
                              ...current,
                              heroSlides: current.heroSlides.filter((_, itemIndex) => itemIndex !== index)
                            }))
                          }
                        >
                          Remove slide
                        </button>
                      </div>

                      <input
                        placeholder="Eyebrow"
                        value={slide.eyebrow}
                        onChange={(e) => updateHeroSlide(index, "eyebrow", e.target.value)}
                      />
                      <input
                        placeholder="Title"
                        value={slide.title}
                        onChange={(e) => updateHeroSlide(index, "title", e.target.value)}
                      />
                      <textarea
                        placeholder="Description"
                        value={slide.description}
                        onChange={(e) => updateHeroSlide(index, "description", e.target.value)}
                      />
                      <input
                        placeholder="Image path"
                        value={slide.image}
                        onChange={(e) => updateHeroSlide(index, "image", e.target.value)}
                      />
                      <div className={styles.uploadBlock}>
                        <label className={styles.uploadLabel}>
                          <span>Upload slide image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadHeroSlideImage(index, e)}
                            disabled={uploadingCover}
                          />
                        </label>
                        <div className={styles.coverPreview}>
                          <img
                            src={resolveProductImage(slide.image, slide.title)}
                            alt={slide.title || `Slide ${index + 1}`}
                          />
                          <span>{uploadingCover ? "Uploading..." : slide.image}</span>
                        </div>
                      </div>
                      <input
                        placeholder="CTA label"
                        value={slide.ctaLabel}
                        onChange={(e) => updateHeroSlide(index, "ctaLabel", e.target.value)}
                      />
                      <input
                        placeholder="CTA href"
                        value={slide.ctaHref}
                        onChange={(e) => updateHeroSlide(index, "ctaHref", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["heroSlides"],
                        "Homepage hero slides saved successfully.",
                        "Save homepage hero slides"
                      )
                    }
                    disabled={savingSettings || uploadingCover}
                  >
                    {getSaveButtonText("Save homepage hero slides")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Category card images</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        categoryHighlights: [
                          ...current.categoryHighlights,
                          newCategoryHighlight()
                        ]
                      }))
                    }
                  >
                    Add category image
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.categoryHighlights.map((highlight, index) => (
                    <div key={`category-highlight-${index}`} className={styles.blockCard}>
                      <div className={styles.groupHeader}>
                        <h2>Category image {index + 1}</h2>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() =>
                            setSettings((current) => ({
                              ...current,
                              categoryHighlights: current.categoryHighlights.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            }))
                          }
                        >
                          Remove image
                        </button>
                      </div>

                      <input
                        placeholder="Category name (example: Mobiles)"
                        value={highlight.category}
                        onChange={(e) =>
                          updateCategoryHighlight(index, "category", e.target.value)
                        }
                      />
                      <input
                        placeholder="Image path"
                        value={highlight.image}
                        onChange={(e) =>
                          updateCategoryHighlight(index, "image", e.target.value)
                        }
                      />
                      <div className={styles.uploadBlock}>
                        <label className={styles.uploadLabel}>
                          <span>Upload category image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadCategoryHighlightImage(index, e)}
                            disabled={uploadingCover}
                          />
                        </label>
                        <div className={styles.coverPreview}>
                          <img
                            src={resolveProductImage(
                              highlight.image,
                              highlight.category,
                              highlight.category
                            )}
                            alt={highlight.category || `Category image ${index + 1}`}
                          />
                          <span>{uploadingCover ? "Uploading..." : highlight.image}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["categoryHighlights"],
                        "Category card images saved successfully.",
                        "Save category card images"
                      )
                    }
                    disabled={savingSettings || uploadingCover}
                  >
                    {getSaveButtonText("Save category card images")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Service tile backgrounds</h2>
                </div>

                <div className={styles.stack}>
                  {serviceTileLabels.map((label, index) => (
                    <div key={`service-tile-${index}`} className={styles.blockCard}>
                      <div className={styles.groupHeader}>
                        <h2>Service tile {index + 1}</h2>
                        <span className={styles.helperText}>{label}</span>
                      </div>

                      <input
                        placeholder="Image path"
                        value={settings.serviceTileImages[index] || ""}
                        onChange={(e) => updateServiceTileImage(index, e.target.value)}
                      />

                      <div className={styles.uploadBlock}>
                        <label className={styles.uploadLabel}>
                          <span>Upload service tile image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadServiceTileImage(index, e)}
                            disabled={uploadingCover}
                          />
                        </label>
                        <div className={styles.coverPreview}>
                          <img
                            src={resolveProductImage(settings.serviceTileImages[index], label)}
                            alt={label}
                          />
                          <span>
                            {uploadingCover
                              ? "Uploading..."
                              : settings.serviceTileImages[index] || "No uploaded image yet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["serviceTileImages"],
                        "Service tile backgrounds saved successfully.",
                        "Save service tile backgrounds"
                      )
                    }
                    disabled={savingSettings || uploadingCover}
                  >
                    {getSaveButtonText("Save service tile backgrounds")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Quote section background</h2>
                </div>

                <div className={styles.stack}>
                  <input
                    placeholder="Quote section background image path"
                    value={settings.quoteSectionImage}
                    onChange={(e) =>
                      setSettings((current) => ({
                        ...current,
                        quoteSectionImage: e.target.value
                      }))
                    }
                  />

                  <div className={styles.uploadBlock}>
                    <label className={styles.uploadLabel}>
                      <span>Upload quote section image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadQuoteSectionImage}
                        disabled={uploadingCover}
                      />
                    </label>
                    <div className={styles.coverPreview}>
                      <img
                        src={
                          settings.quoteSectionImage
                            ? resolveProductImage(settings.quoteSectionImage, "Quote section")
                            : "/products/placeholder.svg"
                        }
                        alt="Quote section background"
                      />
                      <span>
                        {uploadingCover
                          ? "Uploading..."
                          : settings.quoteSectionImage || "No uploaded image yet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["quoteSectionImage"],
                        "Quote section background saved successfully.",
                        "Save quote section background"
                      )
                    }
                    disabled={savingSettings || uploadingCover}
                  >
                    {getSaveButtonText("Save quote section background")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Social links</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        socialLinks: [...current.socialLinks, newSocialLink()]
                      }))
                    }
                  >
                    Add social link
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.socialLinks.map((link, index) => (
                    <div key={`social-${index}`} className={styles.inlineCard}>
                      <input
                        placeholder="Label"
                        value={link.label}
                        onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                      />
                      <input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            socialLinks: current.socialLinks.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["socialLinks"],
                        "Social links saved successfully.",
                        "Save social links"
                      )
                    }
                    disabled={savingSettings}
                  >
                    {getSaveButtonText("Save social links")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>App badges</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        appBadges: [...current.appBadges, newAppBadge()]
                      }))
                    }
                  >
                    Add app badge
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.appBadges.map((badge, index) => (
                    <div key={`badge-${index}`} className={styles.inlineGrid}>
                      <input
                        placeholder="Subtitle"
                        value={badge.subtitle}
                        onChange={(e) => updateAppBadge(index, "subtitle", e.target.value)}
                      />
                      <input
                        placeholder="Label"
                        value={badge.label}
                        onChange={(e) => updateAppBadge(index, "label", e.target.value)}
                      />
                      <input
                        placeholder="URL"
                        value={badge.url}
                        onChange={(e) => updateAppBadge(index, "url", e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            appBadges: current.appBadges.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["appBadges"],
                        "App badges saved successfully.",
                        "Save app badges"
                      )
                    }
                    disabled={savingSettings}
                  >
                    {getSaveButtonText("Save app badges")}
                  </button>
                </div>
              </div>

              <div className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2>Footer sections</h2>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        footerSections: [...current.footerSections, newFooterSection()]
                      }))
                    }
                  >
                    Add footer section
                  </button>
                </div>

                <div className={styles.stack}>
                  {settings.footerSections.map((section, sectionIndex) => (
                    <div key={`section-${sectionIndex}`} className={styles.blockCard}>
                      <div className={styles.groupHeader}>
                        <input
                          placeholder="Section title"
                          value={section.title}
                          onChange={(e) => updateFooterSection(sectionIndex, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() =>
                            setSettings((current) => ({
                              ...current,
                              footerSections: current.footerSections.filter(
                                (_, itemIndex) => itemIndex !== sectionIndex
                              )
                            }))
                          }
                        >
                          Remove section
                        </button>
                      </div>

                      {section.links.map((link, linkIndex) => (
                        <div key={`section-${sectionIndex}-link-${linkIndex}`} className={styles.linkEditor}>
                          <input
                            placeholder="Link label"
                            value={link.label}
                            onChange={(e) =>
                              updateFooterLink(sectionIndex, linkIndex, "label", e.target.value)
                            }
                          />
                          <select
                            value={link.type}
                            onChange={(e) =>
                              updateFooterLink(
                                sectionIndex,
                                linkIndex,
                                "type",
                                e.target.value as SiteLinkType
                              )
                            }
                          >
                            <option value="route">Route</option>
                            <option value="content">Content page</option>
                            <option value="blog_index">Blog index</option>
                            <option value="blog_post">Blog post</option>
                            <option value="external">External URL</option>
                          </select>
                          <input
                            placeholder="Value or slug"
                            value={link.value}
                            onChange={(e) =>
                              updateFooterLink(sectionIndex, linkIndex, "value", e.target.value)
                            }
                          />
                          <label className={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={link.openInNewTab}
                              onChange={(e) =>
                                updateFooterLink(
                                  sectionIndex,
                                  linkIndex,
                                  "openInNewTab",
                                  e.target.checked
                                )
                              }
                            />
                            New tab
                          </label>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              setSettings((current) => ({
                                ...current,
                                footerSections: current.footerSections.map((currentSection, currentIndex) =>
                                  currentIndex === sectionIndex
                                    ? {
                                        ...currentSection,
                                        links: currentSection.links.filter(
                                          (_, itemIndex) => itemIndex !== linkIndex
                                        )
                                      }
                                    : currentSection
                                )
                              }))
                            }
                          >
                            Remove link
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          setSettings((current) => ({
                            ...current,
                            footerSections: current.footerSections.map((currentSection, currentIndex) =>
                              currentIndex === sectionIndex
                                ? {
                                    ...currentSection,
                                    links: [...currentSection.links, newFooterLink()]
                                  }
                                : currentSection
                            )
                          }))
                        }
                      >
                        Add footer link
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.groupFooter}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      persistSettings(
                        ["footerSections"],
                        "Footer sections saved successfully.",
                        "Save footer sections"
                      )
                    }
                    disabled={savingSettings}
                  >
                    {getSaveButtonText("Save footer sections")}
                  </button>
                </div>
              </div>

              <div className={styles.groupFooter}>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    persistSettings(
                      undefined,
                      "All site settings saved successfully.",
                      "Save all site settings"
                    )
                  }
                  disabled={savingSettings || uploadingCover}
                >
                  {getSaveButtonText("Save all site settings")}
                </button>
              </div>
            </div>
          </section>

          <section className={`card ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h1>Content pages</h1>
                <p>Create the real footer destinations managed by the CMS.</p>
              </div>
            </div>

            <form className={styles.form} onSubmit={saveContentPage}>
              {pageError ? <p className={styles.error}>{pageError}</p> : null}
              {pageMessage ? <p className={styles.success}>{pageMessage}</p> : null}

              <input
                placeholder="Title"
                value={pageForm.title}
                onChange={(e) => setPageForm((current) => ({ ...current, title: e.target.value }))}
              />
              <input
                placeholder="Slug"
                value={pageForm.slug}
                onChange={(e) => setPageForm((current) => ({ ...current, slug: e.target.value }))}
              />
              <input
                placeholder="Summary"
                value={pageForm.summary}
                onChange={(e) =>
                  setPageForm((current) => ({ ...current, summary: e.target.value }))
                }
              />
              <select
                value={pageForm.status}
                onChange={(e) =>
                  setPageForm((current) => ({
                    ...current,
                    status: e.target.value as "draft" | "published"
                  }))
                }
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <textarea
                placeholder="Page content"
                value={pageForm.content}
                onChange={(e) =>
                  setPageForm((current) => ({ ...current, content: e.target.value }))
                }
              />

              <div className={styles.actions}>
                <button className="btn" type="submit" disabled={savingPage}>
                  {savingPage ? "Saving..." : editingPageId ? "Update page" : "Create page"}
                </button>
                {editingPageId ? (
                  <button type="button" className="btn secondary" onClick={resetPageForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className={styles.list}>
              {contentPages.map((page) => (
                <div key={page.id} className={styles.listItem}>
                  <div>
                    <strong>{page.title}</strong>
                    <p>{page.slug}</p>
                    <span>{page.status}</span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setEditingPageId(page.id);
                        setPageForm({
                          title: page.title,
                          slug: page.slug,
                          summary: page.summary,
                          content: page.content,
                          status: page.status
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <Link href={`/content/${page.slug}`} className="btn secondary">
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => removeContentPage(page.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`card ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h1>Blog posts</h1>
                <p>Publish real articles for the footer and blog pages.</p>
              </div>
            </div>

            <form className={styles.form} onSubmit={saveBlogPost}>
              {blogError ? <p className={styles.error}>{blogError}</p> : null}
              {blogMessage ? <p className={styles.success}>{blogMessage}</p> : null}

              <input
                placeholder="Title"
                value={blogForm.title}
                onChange={(e) => setBlogForm((current) => ({ ...current, title: e.target.value }))}
              />
              <input
                placeholder="Slug"
                value={blogForm.slug}
                onChange={(e) => setBlogForm((current) => ({ ...current, slug: e.target.value }))}
              />
              <input
                placeholder="Excerpt"
                value={blogForm.excerpt}
                onChange={(e) =>
                  setBlogForm((current) => ({ ...current, excerpt: e.target.value }))
                }
              />
              <input
                placeholder="Cover image path"
                value={blogForm.coverImage}
                onChange={(e) =>
                  setBlogForm((current) => ({ ...current, coverImage: e.target.value }))
                }
              />

              <div className={styles.uploadBlock}>
                <label className={styles.uploadLabel}>
                  <span>Upload cover image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadCoverImage}
                    disabled={savingBlog || uploadingCover}
                  />
                </label>

                <div className={styles.coverPreview}>
                  <img
                    src={resolveProductImage(blogForm.coverImage, blogForm.title)}
                    alt={blogForm.title || "Blog cover preview"}
                  />
                  <span>{uploadingCover ? "Uploading..." : blogForm.coverImage}</span>
                </div>
              </div>

              <textarea
                placeholder="Article content"
                value={blogForm.content}
                onChange={(e) =>
                  setBlogForm((current) => ({ ...current, content: e.target.value }))
                }
              />
              <input
                placeholder="Tags (comma separated)"
                value={blogForm.tags}
                onChange={(e) => setBlogForm((current) => ({ ...current, tags: e.target.value }))}
              />
              <input
                type="datetime-local"
                value={blogForm.publishedAt}
                onChange={(e) =>
                  setBlogForm((current) => ({ ...current, publishedAt: e.target.value }))
                }
              />
              <select
                value={blogForm.status}
                onChange={(e) =>
                  setBlogForm((current) => ({
                    ...current,
                    status: e.target.value as "draft" | "published"
                  }))
                }
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              <div className={styles.actions}>
                <button className="btn" type="submit" disabled={savingBlog || uploadingCover}>
                  {savingBlog ? "Saving..." : editingBlogId ? "Update post" : "Create post"}
                </button>
                {editingBlogId ? (
                  <button type="button" className="btn secondary" onClick={resetBlogForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <div className={styles.list}>
              {blogPosts.map((post) => (
                <div key={post.id} className={styles.listItem}>
                  <div>
                    <strong>{post.title}</strong>
                    <p>{post.slug}</p>
                    <span>{post.status}</span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setEditingBlogId(post.id);
                        setBlogForm({
                          title: post.title,
                          slug: post.slug,
                          excerpt: post.excerpt,
                          coverImage: post.coverImage,
                          content: post.content,
                          tags: post.tags.join(", "),
                          status: post.status,
                          publishedAt: toDateTimeLocalValue(post.publishedAt)
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                    <Link href={`/blog/${post.slug}`} className="btn secondary">
                      View
                    </Link>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => removeBlogPost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
