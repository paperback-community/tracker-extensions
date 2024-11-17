import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
  name: "AniList",
  description: "The anilist.co tracker extension.",
  version: "2.0.0",
  icon: "icon.png",
  language: "English",
  contentRating: ContentRating.EVERYONE,
  badges: [
    { label: "Tracker", textColor: "#FFFFFF", backgroundColor: "#005ff9" },
  ],
  capabilities: [
    SourceIntents.SETTINGS_UI,
    SourceIntents.HOMEPAGE_SECTIONS,
    SourceIntents.MANGA_SEARCH,
    SourceIntents.MANGA_TRACKING,
    SourceIntents.COLLECTION_MANAGEMENT,
  ],
  developers: [
    {
      name: "Celarye",
      website: "https://celarye.dev",
      github: "https://github.com/Celarye",
    },
  ],
} as SourceInfo;
