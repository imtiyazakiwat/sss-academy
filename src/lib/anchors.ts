/**
 * Shared deep-link targets.
 *
 * Kept dependency-free on purpose: the navbar ships on every page, so it must
 * not pull the enquiry schema (and zod with it) into the client bundle just to
 * know where its CTA points.
 */

/** Stable DOM id of the enquiry form's "Full name" input. */
export const ENQUIRY_NAME_FIELD_ID = "enquiry-name";

/**
 * Target for "start an enquiry" CTAs — lands on the contact page with the caret
 * already in the first field. Pass a course slug to preselect it in the form.
 */
export function enquiryHref(courseSlug?: string): string {
  const query = courseSlug ? `?course=${encodeURIComponent(courseSlug)}` : "";
  return `/contact${query}#${ENQUIRY_NAME_FIELD_ID}`;
}

/** Course-agnostic enquiry link, for CTAs that are not about one course. */
export const ENQUIRY_HREF = enquiryHref();

/**
 * Scrolls the enquiry form's first field into view and focuses it.
 *
 * Returns false when the field is not on the page yet — in that case the CTA is
 * a normal route change and the form focuses itself once it mounts.
 */
export function focusEnquiryField(): boolean {
  const field = document.getElementById(ENQUIRY_NAME_FIELD_ID);
  if (!field) return false;

  // No behavior override, so the page's scroll-behavior (auto under
  // prefers-reduced-motion) decides whether this animates.
  field.scrollIntoView({ block: "center" });
  field.focus({ preventScroll: true });
  return true;
}
