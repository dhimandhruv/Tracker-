// Server component: reads the session so the header can render the right account
// control in the first HTML response, with no signed-in/signed-out flicker.
import { auth } from "@/auth";
import Tracker from "@/components/Tracker";
import type { HeaderUser } from "@/components/AuthButton";

export default async function Home() {
  const session = await auth();

  // Narrow the session down to just what the header draws. Keeping the shape
  // small means no session internals leak into the client bundle.
  const user: HeaderUser | null = session?.user
    ? { name: session.user.name ?? "Signed in", image: session.user.image ?? null }
    : null;

  return <Tracker user={user} />;
}
