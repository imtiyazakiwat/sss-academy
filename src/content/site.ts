/**
 * Canonical organisation data.
 * Every value here was extracted from the legacy PHP site (sssacademy.in)
 * during the content audit — do not invent new facts in this file.
 */

export const site = {
  name: "SSS Academy",
  legalName: "SSS Academy",
  tagline: "Learn · Practice · Succeed",
  promise: "Empowering IT Professionals",
  url: "https://sssacademy.in",
  description:
    "Industry-oriented training in SQL, Python, ETL Testing, PySpark, Snowflake, Azure Data Factory, Databricks, Power BI and Data Engineering — with placement assistance. Based in Chikkodi, Karnataka.",
  shortDescription:
    "Professional IT training in SQL, Python, ETL Testing, Azure Data Factory, NumPy, Power BI and PySpark.",
} as const;

export const contact = {
  email: "info@sssacademy.in",
  phones: ["+91 6360304019", "+91 9916327742"] as const,
  /** tel: hrefs, digits only */
  phoneHrefs: ["+916360304019", "+919916327742"] as const,
  whatsapp: "916360304019",
  address: {
    line1: "Above IDBI Bank",
    line2: "B.K. College Road, Ambedkar Nagar",
    locality: "Chikkodi",
    region: "Karnataka",
    postalCode: "591201",
    country: "IN",
  },
  geo: { lat: 16.429, lng: 74.585 },
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d239.18201217178307!2d74.58703670554841!3d16.429285209956447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc0e99c880adb85%3A0x28061a7edaa973dd!2sIDBI%20Bank!5e0!3m2!1sen!2sin!4v1782969183136!5m2!1sen!2sin",
  mapLink: "https://maps.google.com/?q=16.429,74.585",
  hours: [
    { days: "Monday – Friday", time: "9:00 AM – 8:00 PM" },
    { days: "Saturday", time: "9:00 AM – 6:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
} as const;

export const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/sss-academy-chikodi-820aaa413/",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/sssacachikodi/",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@sssacademy-g6s",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61591788088815",
  },
] as const;

export const nav = [
  { label: "Courses", href: "/courses" },
  { label: "Placements", href: "/placements" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const formattedAddress = [
  contact.address.line1,
  contact.address.line2,
  `${contact.address.locality}, ${contact.address.region} ${contact.address.postalCode}`,
].join(", ");
