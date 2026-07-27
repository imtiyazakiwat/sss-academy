/**
 * Emits a JSON-LD block. Kept as a component so pages don't repeat the
 * dangerouslySetInnerHTML boilerplate, and so the serialisation stays in one place.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
