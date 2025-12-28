// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE = {
  title: "arthurcm.com",
  description:
    "Software engineering insights, infrastructure tooling, and developer experience articles by Arthur Campbell Martelli.",
} as const;

export const AUTHOR = {
  name: "Arthur Campbell",
  email: "arthur.martellig@gmail.com",
  phone: "+503 7611-6134",
} as const;

export const SOCIALS: SocialMedia = {
  github: {
    handle: "arthurmartelli",
    url: "https://github.com/arthurmartelli",
    label: "Go to Arthur's GitHub",
  },
  linkedin: {
    handle: "arthur-martelli",
    url: "https://www.linkedin.com/in/arthur-martelli",
    label: "Connect on LinkedIn",
  },
  youtube: {
    handle: "@arthur_martellg",
    url: "https://www.youtube.com/@arthur_campbell",
    label: "Subscribe on YouTube",
  },
  twitter: {
    handle: "@arthur_martellg",
    url: "https://x.com/arthur_martellg",
    label: "Follow on Twitter",
  },
} as const;
