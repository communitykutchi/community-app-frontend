export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogImage?: string;
}

export const DEFAULT_SEO_CONFIG = {
  siteName: "All Kutchi Community Portal",
  domain: "https://kutchicommunity.com",
  defaultOgImage: "/adaptive.png",
  twitterHandle: "@kutchicommunity",
  defaultKeywords: [
    "Kutchi Community",
    "Kutchi Community Portal",
    "Kutchi Samaj",
    "Kutchi Directory",
    "Kutchi Jobs",
    "Kutchi Workers",
    "Kutchi Notices",
    "Kutchi Mayyat Updates",
    "Kutchi News",
    "Kutchi Matrimonial",
    "Kutchi Business Network",
    "All Kutchi Community",
    "Kutchi People",
    "Kutchi Association",
    "Kutchi Portal Online",
  ],
};

export const PAGE_SEO_SETTINGS: Record<string, PageSEO> = {
  home: {
    title: "All Kutchi Community Portal | Official Community Platform",
    description: "Welcome to the official All Kutchi Community Portal. Connect with community members, view notices, participate in polls, discover jobs, and get Mayyat updates.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Community Home",
      "Kutchi Social Network",
      "Kutchi Member Connect",
    ],
  },
  feed: {
    title: "Community Feed & Posts | All Kutchi Community",
    description: "Explore the latest posts, updates, announcements, and discussions shared by Kutchi community members worldwide.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Community Feed",
      "Kutchi Posts",
      "Kutchi Social Updates",
    ],
  },
  notices: {
    title: "Official Notices & Mayyat Updates | All Kutchi Community",
    description: "Stay informed with official Kutchi community notices, circulars, event announcements, emergency alerts, and Mayyat (condolence) updates.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Notices",
      "Kutchi Mayyat Notices",
      "Kutchi Announcements",
      "Kutchi Circulars",
    ],
  },
  polls: {
    title: "Community Polls & Opinions | All Kutchi Community",
    description: "Voice your opinion and vote on key Kutchi community decisions, polls, surveys, and community initiatives.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Polls",
      "Kutchi Voting",
      "Kutchi Community Survey",
    ],
  },
  workers: {
    title: "Kutchi Directory, Jobs & Skill Workers | All Kutchi Community",
    description: "Find verified Kutchi skilled workers, job openings, business listings, and professional service providers in our community directory.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Jobs",
      "Kutchi Workers",
      "Kutchi Business Directory",
      "Kutchi Services",
    ],
  },
  help: {
    title: "Support & Help Center | All Kutchi Community",
    description: "Get assistance, contact community administrators, read FAQs, and submit inquiries on the All Kutchi Community Portal.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Support",
      "Kutchi Help",
      "Kutchi Admin Contact",
    ],
  },
  login: {
    title: "Member Login | All Kutchi Community Portal",
    description: "Log in to your All Kutchi Community Portal account to access community posts, notices, group chats, and directory.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Login",
      "Kutchi Portal Sign In",
    ],
  },
  register: {
    title: "Join Community - Register Account | All Kutchi Community Portal",
    description: "Register today to become a member of the official All Kutchi Community Portal and stay connected with Kutchi members worldwide.",
    keywords: [
      ...DEFAULT_SEO_CONFIG.defaultKeywords,
      "Kutchi Registration",
      "Join Kutchi Community",
      "Create Kutchi Account",
    ],
  },
};
