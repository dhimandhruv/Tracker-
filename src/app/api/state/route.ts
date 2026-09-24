// Per-user state sync. One row per user, whole-document read and write.
//
// Conflict resolution is last-writer-wins on the client's own `updatedAt`
// (see the README): a PUT is accepted only if it is at least as new as what is
// stored, otherwise the server wins and hands back its copy for the client to
// adopt. That is enough for one person on a laptop and a phone, and it needs no
// websockets or merge logic.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LIMITS, trackerStateSchema } from "@/lib/schema";

/** Sync responses are per-user and must never be cached by a CDN or the browser. */
/**
 * This route reads the session cookie, so it can never be prerendered or cached
 * at build time. Next infers that already; saying it explicitly means a future
 * refactor cannot accidentally make it static.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

const unauthorized = () => json({ error: "Not signed in" }, 401);

export async function GET() {
  const session = await auth();
  // The user id always comes from the session, never from the request.
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const row = await prisma.trackerState.findUnique({ where: { userId } });
  if (!row) return json({ state: null });

  return json({ state: withUpdatedAt(row.data, row.updatedAt), savedAt: row.savedAt });
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  // Reject oversized bodies before parsing them. Content-Length is a hint a
  // client could lie about, so the real text length is checked as well.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > LIMITS.bodyBytes) return tooLarge();

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > LIMITS.bodyBytes) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Body is not valid JSON" }, 400);
  }

  const parsed = trackerStateSchema.safeParse(body);
  if (!parsed.success) {
    // First issue only: the client cannot fix a validation error at runtime, so
    // this is for a developer reading the network tab, not for the UI.
    const issue = parsed.error.issues[0];
    return json({ error: `Invalid state: ${issue.path.join(".") || "body"} ${issue.message}` }, 400);
  }

  const incoming = parsed.data;

  const stored = await prisma.trackerState.findUnique({ where: { userId } });

  // Stale write: someone else (the other device) has newer data. Tell the client
  // to adopt the stored copy instead of silently losing their change.
  if (stored && incoming.updatedAt < Number(stored.updatedAt)) {
    return json({ state: withUpdatedAt(stored.data, stored.updatedAt), savedAt: stored.savedAt }, 409);
  }

  const row = await prisma.trackerState.upsert({
    where: { userId },
    create: { userId, data: incoming, updatedAt: BigInt(incoming.updatedAt) },
    update: { data: incoming, updatedAt: BigInt(incoming.updatedAt) },
  });

  return json({ state: withUpdatedAt(row.data, row.updatedAt), savedAt: row.savedAt });
}

function tooLarge() {
  return json({ error: "State is too large" }, 413);
}

/**
 * Rebuilds the response state from the stored blob plus the authoritative
 * BigInt column. `updatedAt` lives in its own column so Postgres can compare it,
 * and BigInt is not JSON-serialisable, so it is narrowed back to a number here.
 */
function withUpdatedAt(data: unknown, updatedAt: bigint) {
  return { ...(data as Record<string, unknown>), updatedAt: Number(updatedAt) };
}
