import { api, HydrateClient } from "~/trpc/server";
import { HomeContent } from "./_components/home-content";

export default async function Home() {
  // Prefetch some data for better performance
  await api.group.getAll.prefetch();

  return (
    <HydrateClient>
      <HomeContent />
    </HydrateClient>
  );
}
