import Link from "next/link";

/**
 * Admin-scoped 404. Without this, a missing enquiry id would render the
 * marketing 404 — course cards and a call-to-action — inside the dashboard.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
      <div className="max-w-md text-center">
        <p className="font-mono text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-500 uppercase">
          404
        </p>
        <h1 className="text-headline mt-2 text-navy-950">Not in here</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          That record does not exist, or it was deleted. Nothing has changed.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-sm font-medium text-ember-700 underline decoration-ember-300 underline-offset-4"
        >
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
