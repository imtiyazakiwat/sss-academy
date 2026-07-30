import type { Metadata } from "next";

import { VideoEditor } from "@/app/admin/(dashboard)/videos/VideoEditor";
import { VideoRow } from "@/app/admin/(dashboard)/videos/VideoRow";
import { AdminPageHeader, Card } from "@/app/admin/_components/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllVideos } from "@/lib/cms/videos";

export const metadata: Metadata = { title: "YouTube Videos" };
export const dynamic = "force-dynamic";

/**
 * Admin page for managing YouTube demo class videos shown on the homepage.
 */
export default async function VideosPage() {
  await requireAdmin();

  const videos = await listAllVideos();

  return (
    <>
      <AdminPageHeader
        title="YouTube Videos"
        description={'Manage the demo class videos shown in the "Watch Our Demo Classes" section on the homepage. Paste any YouTube link — the video will be embedded automatically.'}
      />

      {videos === null ? (
        <div className="border-l-4 border-ember-600 bg-ember-50 px-4 py-3 text-sm leading-6 text-ember-900">
          Firestore is unreachable, so videos cannot be loaded or edited. The
          homepage section will simply be hidden.
        </div>
      ) : (
        <>
          <Card>
            <h2 className="text-title text-navy-950">Add video</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              Paste a YouTube URL and it will appear on the homepage. Active
              videos display in order, lowest first.
            </p>
            <div className="mt-5">
              <VideoEditor />
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="text-title text-navy-950">
              All videos{" "}
              <span className="text-base font-normal text-ink-500">
                ({videos.length})
              </span>
            </h2>

            {videos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-ink-300 bg-[#fffdf8] px-5 py-10 text-center text-sm text-ink-500">
                No videos yet. Add one above to get started.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {videos.map((video) => (
                  <VideoRow key={video.id} video={video} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
