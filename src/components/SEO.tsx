import React, { useEffect } from "react";
import { DEFAULT_SEO_CONFIG, PAGE_SEO_SETTINGS } from "../config/seo.config";

interface SEOProps {
  pageKey?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export const SEO: React.FC<SEOProps> = ({
  pageKey,
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
}) => {
  useEffect(() => {
    const pageConfig = pageKey ? PAGE_SEO_SETTINGS[pageKey] : null;

    const finalTitle =
      title ||
      pageConfig?.title ||
      DEFAULT_SEO_CONFIG.siteName;

    const finalDescription =
      description ||
      pageConfig?.description ||
      "Official All Kutchi Community Portal - Connect with community members, official notices, Mayyat updates, polls, career opportunities, and direct messaging.";

    const finalKeywords = [
      ...(keywords || pageConfig?.keywords || DEFAULT_SEO_CONFIG.defaultKeywords),
    ];

    const currentUrl = window.location.href;
    const finalCanonical = canonical || currentUrl;
    const finalOgImage = ogImage || DEFAULT_SEO_CONFIG.defaultOgImage;

    // 1. Update Document Title
    document.title = finalTitle;

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, nameAttr: string, value: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        const [attrName, attrVal] = selector.replace("meta[", "").replace("]", "").split("=");
        const cleanedAttrVal = attrVal ? attrVal.replace(/"/g, "") : "";
        element.setAttribute(attrName, cleanedAttrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    // 2. Set Meta Description & Keywords
    setMetaTag('meta[name="description"]', "name", finalDescription);
    setMetaTag('meta[name="keywords"]', "name", finalKeywords.join(", "));

    // 3. Set OpenGraph Meta Tags
    setMetaTag('meta[property="og:title"]', "property", finalTitle);
    setMetaTag('meta[property="og:description"]', "property", finalDescription);
    setMetaTag('meta[property="og:type"]', "property", ogType);
    setMetaTag('meta[property="og:url"]', "property", finalCanonical);
    setMetaTag('meta[property="og:image"]', "property", finalOgImage);
    setMetaTag('meta[property="og:site_name"]', "property", DEFAULT_SEO_CONFIG.siteName);

    // 4. Set Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "name", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", finalTitle);
    setMetaTag('meta[name="twitter:description"]', "name", finalDescription);
    setMetaTag('meta[name="twitter:image"]', "name", finalOgImage);

    // 5. Set Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", finalCanonical);

  }, [pageKey, title, description, keywords, canonical, ogImage, ogType]);

  return null;
};

export default SEO;
