import type { Metadata } from "next";

import { BannerEditor } from "@/app/admin/(dashboard)/banners/BannerEditor";
import { BannerRow } from "@/app/admin/(dashboard)/banners/BannerRow";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllBanners } from "@/lib/cms/banners";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

/**
 * The homepage announcement popup, editable. Same pattern as Notices: saving
 * publishes straight to the live site, so there is no draft step beyond the
 * "Show on the site" checkbox.
 */
export default async function BannersPage() {
  await requireAdmin();

  const banners = await listAllBanners();

  return (
    <>
      <AdminPageHeader
        title="Banners"
        description="The popup that greets visitors on the homepage. Nothing shows unless a banner is active, so the site never carries an announcement staff did not publish."
      />

      {banners === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so banners cannot be loaded or edited. The
          public site simply shows no popup.
        </div>
      ) : (
        <>
          <Card>
            <h2 className="text-title text-navy-950">New banner</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              Saving publishes straight to the live homepage popup. There is no
              draft step — the audit log is the safety net.
            </p>
            <div className="mt-5">
              <BannerEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All banners{" "}
              <span className="text-base font-normal text-ink-500">
                ({banners.length})
              </span>
            </h2>

            {banners.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                No banners yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {banners.map((banner) => (
                  <BannerRow key={banner.id} banner={banner} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
