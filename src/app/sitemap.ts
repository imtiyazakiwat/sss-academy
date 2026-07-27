import type { MetadataRoute } from "next";

import { courses } from "@/content/courses";
import { labs } from "@/content/labs";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: `${site.url}/`, priority: 1, changeFrequency: "weekly" },
      { url: `${site.url}/courses`, priority: 0.9, changeFrequency: "monthly" },
      { url: `${site.url}/playground`, priority: 0.9, changeFrequency: "monthly" },
      {
        url: `${site.url}/placements`,
        priority: 0.8,
        changeFrequency: "monthly",
      },
      { url: `${site.url}/about`, priority: 0.7, changeFrequency: "yearly" },
      { url: `${site.url}/contact`, priority: 0.8, changeFrequency: "yearly" },
    ] satisfies MetadataRoute.Sitemap
  ).map((entry) => ({ ...entry, lastModified }));

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${site.url}/courses/${course.slug}`,
    lastModified,
    priority: course.featured ? 0.8 : 0.6,
    changeFrequency: "monthly",
  }));

  const labRoutes: MetadataRoute.Sitemap = labs.map((lab) => ({
    url: `${site.url}/playground/${lab.slug}`,
    lastModified,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  return [...staticRoutes, ...courseRoutes, ...labRoutes];
}
