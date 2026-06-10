import useSWR from "swr";
import { useRouter } from "next/router";
import { useEffect } from "react";
import type { SessionUser } from "@/types/index";

async function fetcher(url: string): Promise<SessionUser> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("unauthenticated");
  return res.json();
}

interface UseUserOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useUser({
  redirectTo = "/login",
  redirectIfFound = false,
}: UseUserOptions = {}) {
  const router = useRouter();
  const { data, error } = useSWR<SessionUser, Error>("/api/v1/user", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const finished = Boolean(data || error);
  const user = data?.id ? data : null;

  useEffect(() => {
    if (!finished) return;
    if (redirectIfFound && user) router.replace(redirectTo);
    else if (!redirectIfFound && !user) router.replace(redirectTo);
  }, [user, finished, redirectTo, redirectIfFound, router]);

  return { user, isLoading: !finished };
}
