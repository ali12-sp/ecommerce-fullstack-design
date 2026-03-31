import type { SiteLink } from "@/lib/types";

export function resolveSiteLinkHref(link: SiteLink) {
  switch (link.type) {
    case "content":
      return `/content/${link.value}`;
    case "blog_index":
      return "/blog";
    case "blog_post":
      return `/blog/${link.value}`;
    case "external":
      return link.value;
    case "route":
    default:
      if (!link.value) return "/";
      return link.value.startsWith("/") ? link.value : `/${link.value}`;
  }
}

export function isExternalSiteLink(link: SiteLink) {
  return link.type === "external" || link.openInNewTab;
}

export function splitContentBlocks(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function formatPublishedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}
