import { SessionRoomClient } from "../_components/session-room-client";

type SessionRoomPageProps = {
  params: Promise<{
    childId: string;
  }>;
};

export default async function SessionRoomPage({ params }: SessionRoomPageProps) {
  const { childId } = await params;

  return <SessionRoomClient childId={decodeURIComponent(childId)} />;
}
