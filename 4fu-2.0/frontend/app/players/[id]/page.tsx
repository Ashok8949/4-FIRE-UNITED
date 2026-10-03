import PlayerProfilePage from "../../../components/players/PlayerProfilePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlayerProfilePage id={decodeURIComponent(id)} />;
}
