import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Every server action / route handler that mutates data must call
 * this and use the returned id as the ONLY source of "who is doing
 * this" — never accept a userId from the request body or form data.
 * See src/lib/ratings/actions.ts for the pattern.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}
