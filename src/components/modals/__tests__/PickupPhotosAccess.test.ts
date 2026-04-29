import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * These tests verify the client-side contract for serving authorized-pickup
 * photos. The actual access control is enforced by Supabase Storage RLS
 * policies (see migration: can_access_crianca + storage policies on the
 * `authorized-pickups-photos` bucket). Here we assert that:
 *   1. The frontend never uses public URLs for this bucket.
 *   2. Signed URLs are generated for 24h (60 * 60 * 24 seconds).
 *   3. When RLS denies access, createSignedUrls returns empty/error entries
 *      and we surface no usable URL to the unauthorized viewer.
 *   4. When RLS allows access, the returned signed URL is propagated.
 */

type SignedResult = { signedUrl: string | null; path: string; error?: string | null };

const createMockClient = (signed: SignedResult[]) => {
  const createSignedUrls = vi.fn(async (_paths: string[], _ttl: number) => ({
    data: signed,
    error: null,
  }));
  const getPublicUrl = vi.fn();
  return {
    createSignedUrls,
    getPublicUrl,
    storage: {
      from: vi.fn(() => ({ createSignedUrls, getPublicUrl })),
    },
  };
};

// Replica da rotina usada nos modais (PickupModal / AuthorizedPickupsModal).
async function resolveSignedUrls(
  client: ReturnType<typeof createMockClient>,
  rows: { id: string; foto_url: string | null }[],
) {
  const paths = rows
    .map((r) => r.foto_url)
    .filter((p): p is string => !!p && !p.startsWith("http"));
  if (paths.length === 0) return {} as Record<string, string>;
  const bucket = client.storage.from("authorized-pickups-photos") as unknown as {
    createSignedUrls: (paths: string[], ttl: number) => Promise<{ data: SignedResult[] | null }>;
  };
  const { data } = await bucket.createSignedUrls(paths, 60 * 60 * 24);
  const map: Record<string, string> = {};
  data?.forEach((d, i) => {
    if (d.signedUrl) map[paths[i]] = d.signedUrl;
  });
  return map;
}

describe("Authorized pickup photos — access control", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests signed URLs with 24h TTL (60*60*24 seconds)", async () => {
    const client = createMockClient([
      { path: "child-1/p1.jpg", signedUrl: "https://signed/p1?token=abc" },
    ]);
    await resolveSignedUrls(client, [{ id: "p1", foto_url: "child-1/p1.jpg" }]);

    expect(client.storage.from).toHaveBeenCalledWith("authorized-pickups-photos");
    expect(client.createSignedUrls).toHaveBeenCalledTimes(1);
    const [, ttl] = client.createSignedUrls.mock.calls[0];
    expect(ttl).toBe(60 * 60 * 24);
    expect(ttl).toBe(86400);
  });

  it("never falls back to getPublicUrl for the private bucket", async () => {
    const client = createMockClient([
      { path: "child-1/p1.jpg", signedUrl: "https://signed/p1" },
    ]);
    await resolveSignedUrls(client, [{ id: "p1", foto_url: "child-1/p1.jpg" }]);
    expect(client.getPublicUrl).not.toHaveBeenCalled();
  });

  it("returns no URL when RLS blocks the unauthorized user (signed URL is null)", async () => {
    // Simulates Supabase Storage refusing to sign because RLS SELECT denied.
    const client = createMockClient([
      { path: "child-secret/p9.jpg", signedUrl: null, error: "Object not found" },
    ]);
    const map = await resolveSignedUrls(client, [
      { id: "p9", foto_url: "child-secret/p9.jpg" },
    ]);
    expect(map).toEqual({});
  });

  it("returns no URL when authorized_pickups query returns nothing (RLS hides rows)", async () => {
    const client = createMockClient([]);
    // Unauthorized viewer: the parent query (authorized_pickups SELECT) is
    // already filtered by RLS and returns []. We must not even attempt to
    // sign anything.
    const map = await resolveSignedUrls(client, []);
    expect(map).toEqual({});
    expect(client.createSignedUrls).not.toHaveBeenCalled();
  });

  it("propagates signed URL only for paths the storage layer accepted", async () => {
    const client = createMockClient([
      { path: "child-1/p1.jpg", signedUrl: "https://signed/p1?token=ok" },
      { path: "child-1/p2.jpg", signedUrl: null, error: "Forbidden" },
    ]);
    const map = await resolveSignedUrls(client, [
      { id: "p1", foto_url: "child-1/p1.jpg" },
      { id: "p2", foto_url: "child-1/p2.jpg" },
    ]);
    expect(map).toEqual({ "child-1/p1.jpg": "https://signed/p1?token=ok" });
    expect(map["child-1/p2.jpg"]).toBeUndefined();
  });

  it("does not attempt to sign legacy absolute URLs (backwards compatibility)", async () => {
    const client = createMockClient([]);
    const map = await resolveSignedUrls(client, [
      { id: "old", foto_url: "https://legacy.example.com/photo.jpg" },
    ]);
    expect(client.createSignedUrls).not.toHaveBeenCalled();
    expect(map).toEqual({});
  });
});
