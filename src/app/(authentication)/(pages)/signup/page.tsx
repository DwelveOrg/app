import SignupPageClient from "./page-client";

type SignupPageProps = {
  searchParams?: Promise<{
    next?: string;
    telegram?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return <SignupPageClient next={params?.next} telegram={params?.telegram} />;
}
