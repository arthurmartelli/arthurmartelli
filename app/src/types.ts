export type SocialMediaPlatform = "twitter" | "linkedin" | "youtube" | "github";
export type SocialMedia = {
  [platform in SocialMediaPlatform]: {
    url: string;
    handle: string;
    label: string;
  };
};
