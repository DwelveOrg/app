import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { classId } = await params;
  redirect(`/groups/${classId}`);
}
