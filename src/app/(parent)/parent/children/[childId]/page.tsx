import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  redirect(`/parent/children/${childId}/sessions`);
}
