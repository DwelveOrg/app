import LoginPageClient from "./page-client";

type LoginPageProps = {
  searchParams?: Promise<{
    deleted?: string;
    logout?: string;
    next?: string;
    telegram?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginPageClient
      deleted={params?.deleted}
      logout={params?.logout}
      next={params?.next}
      telegram={params?.telegram}
    />
  );
}
