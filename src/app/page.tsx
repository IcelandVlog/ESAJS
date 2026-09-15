import { db } from "@/db/client";
import { notices } from "@/db/schema";
import { desc } from "drizzle-orm";
import HomeView from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.id));
  return <HomeView notices={allNotices} />;
}
