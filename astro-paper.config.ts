import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://antonio.m6i.it/",
    title: "Antonio Molinari",
    description: "web developer and tech enthusiast",
    author: "Antonio Molinari",
    profile: "https://antonio.m6i.it/",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Europe/Rome",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
    },
    search: "pagefind",
  },
  socials: [
    { name: "mail",      url: "mailto:antoniomolinari@me.com" },
    { name: "github",    url: "https://github.com/magnum" },
    { name: "linkedin",  url: "https://linkedin.com/in/magnum" },
    { name: "instagram", url: "https://instagram.com/amolinari" },
    { name: "unsplash",  url: "https://unsplash.com/it/@amolinari" },
    { name: "dribbble",  url: "https://dribbble.com/antoniomolinari" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "linkedin", url: "https://www.linkedin.com/sharing/share-offsite/?url=" },
    { name: "mail",     url: "mailto:?subject=Vedi%20questo%20post&body=" },
  ],
});
