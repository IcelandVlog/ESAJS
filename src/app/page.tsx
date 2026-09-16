import { db } from "@/db/client";
import { notices, galleryPhotos } from "@/db/schema";
import { desc } from "drizzle-orm";
import HomeView from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [allNotices, allPhotos] = await Promise.all([
    db.select().from(notices).orderBy(desc(notices.id)),
    db.select().from(galleryPhotos).orderBy(desc(galleryPhotos.id)),
  ]);
  return <HomeView notices={allNotices} photos={allPhotos} />;
}
