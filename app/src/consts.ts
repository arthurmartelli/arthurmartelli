// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

const today = new Date();

export const SITE = {
	title: "arthurcm.com",
	description: "Software engineering insights, infrastructure tooling, and developer experience articles by Arthur Campbell Martelli.",
	twitterHandle: "@arthur_campbell",
} as const;

export const AUTHOR = {
	name: "Arthur Campbell",
	email: "arthur.martellig@gmail.com",
	phone: "+503 7611-6134",
} as const;

export const SOCIALS = {
	github: {
		username: "arthurmartelli",
		url: "https://github.com/arthurmartelli",
		label: "Go to Arthur's GitHub",
		icon: "github",
	},
	linkedin: {
		url: "https://www.linkedin.com/in/arthur-martelli",
		label: "Connect on LinkedIn",
		icon: "linkedin",
	},
	youtube: {
		url: "https://www.youtube.com/@arthur_campbell",
		label: "Subscribe on YouTube",
		icon: "youtube",
	},
} as const;

// Legacy exports for backwards compatibility
export const NAME = AUTHOR.name;
export const EMAIL = AUTHOR.email;
export const PHONE = AUTHOR.phone;
export const GITHUB_USERNAME = SOCIALS.github.username;
export const SITE_TITLE = SITE.title;
export const SITE_DESCRIPTION = SITE.description;
export const COPYRIGHT = `${today.getFullYear()} ${NAME}. All rights reserved.`;
