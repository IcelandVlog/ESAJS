import OAuthCompleteView from "@/components/OAuthCompleteView";

export const dynamic = "force-dynamic";

export default async function OAuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft } = await searchParams;
  return <OAuthCompleteView draft={draft || ""} />;
}
