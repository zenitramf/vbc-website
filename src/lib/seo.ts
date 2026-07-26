import { churchInfo, defaultSEO } from "@/lib/church-data";

/** Per-page metadata. All fields optional — `buildSEO()` fills site defaults. */
export interface SEOInput {
  /** Page-specific title (without the ` | Victory Baptist Church` suffix). */
  title?: string;
  /**
   * Append ` | ${siteName}` to the title. Default true. Set false for the
   * home page where the title reads best as just the org name + tagline.
   */
  titleTemplate?: boolean;
  description?: string;
  /** Override the canonical URL (defaults to `Astro.url`). */
  canonical?: string;
  /** Path or absolute URL for the social share image. Defaults to `defaultSEO.ogImage`. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  /** Set true to emit `<meta name="robots" content="noindex, follow">`. */
  noindex?: boolean;
  /** Optional JSON-LD object rendered as a `<script type="application/ld+json">`. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Resolved SEO values after merging page input onto site defaults. */
export interface SEO {
  title: string;
  description: string;
  canonical?: string;
  image: string;
  imageAlt: string;
  type: "website" | "article" | "profile";
  noindex: boolean;
  jsonLd?: SEOInput["jsonLd"];
}

/**
 * Merge page-specific SEO overrides onto site-wide defaults and apply the
 * site-name title template when requested.
 */
export const buildSEO = (input: SEOInput = {}): SEO => {
  const pageTitle = input.title ?? churchInfo.name;
  const alreadyIncludesSiteName = pageTitle.endsWith(` | ${churchInfo.name}`);
  const shouldApplyTemplate =
    Boolean(input.title) &&
    (input.titleTemplate ?? true) &&
    !alreadyIncludesSiteName;
  const title = shouldApplyTemplate
    ? `${pageTitle} | ${churchInfo.name}`
    : pageTitle;

  return {
    canonical: input.canonical,
    description: input.description ?? defaultSEO.description,
    image: input.image ?? defaultSEO.ogImage,
    imageAlt: input.imageAlt ?? defaultSEO.ogImageAlt,
    jsonLd: input.jsonLd,
    noindex: input.noindex ?? false,
    title,
    type: input.type ?? "website",
  };
};

/** Resolve a possibly-relative path to an absolute URL using the configured site origin. */
export const absoluteUrl = (path?: string, fallback?: string): string => {
  if (!path) {
    return fallback ?? "";
  }
  try {
    return new URL(path, churchInfo.url).href;
  } catch {
    return path;
  }
};

/** Default JSON-LD `Church` organization data for the home page. */
export const churchOrganizationLd = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Church",
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
    addressLocality: "Fresno",
    addressRegion: "CA",
    postalCode: "93727",
    streetAddress: churchInfo.addressLine1,
  },
  email: churchInfo.email,
  image: absoluteUrl(defaultSEO.ogImage),
  logo: absoluteUrl(churchInfo.logo),
  name: churchInfo.name,
  sameAs: [churchInfo.facebook, churchInfo.youtube],
  telephone: churchInfo.phoneE164,
  url: churchInfo.url,
});
