/**
 * Cache tags for the CMS loaders.
 *
 * Every `unstable_cache` tag and every `revalidateTag` call must come from this
 * file. A typo in a string literal fails silently — content simply stops
 * refreshing — so the constants are the only supported spelling.
 *
 * Deliberately free of imports: middleware, client components and server
 * actions all read from here.
 */
export const TAGS = {
  courses: "courses",
  placements: "placements",
  team: "team",
  faqs: "faqs",
  settings: "settings",
  notices: "notices",
  batches: "batches",
  banners: "banners",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

export const COURSES_TAG = TAGS.courses;
export const PLACEMENTS_TAG = TAGS.placements;
export const TEAM_TAG = TAGS.team;
export const FAQS_TAG = TAGS.faqs;
export const SETTINGS_TAG = TAGS.settings;
export const NOTICES_TAG = TAGS.notices;
export const BATCHES_TAG = TAGS.batches;
export const BANNERS_TAG = TAGS.banners;
