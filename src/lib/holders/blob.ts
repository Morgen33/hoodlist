import { get, list, put } from "@vercel/blob";
import {
  parseSnapshot,
  parseSnapshotMeta,
  toSnapshotMeta,
} from "./snapshot";
import type { HolderSnapshot, HolderSnapshotMeta } from "./types";

const META_PREFIX = "snapshots/meta/";
const DATA_PREFIX = "snapshots/data/";

function metaPath(id: string) {
  return `${META_PREFIX}${id}.json`;
}

function dataPath(id: string) {
  return `${DATA_PREFIX}${id}.json`;
}

async function readJsonBlob(pathname: string): Promise<unknown | null> {
  const result = await get(pathname, { access: "public", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function listSnapshotMetas(): Promise<HolderSnapshotMeta[]> {
  const snapshots: HolderSnapshotMeta[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix: META_PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const parsed = parseSnapshotMeta(await readJsonBlob(blob.pathname));
      if (parsed) snapshots.push(parsed);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readSnapshot(
  id: string,
): Promise<HolderSnapshot | null> {
  return parseSnapshot(await readJsonBlob(dataPath(id)));
}

export async function writeSnapshot(
  snapshot: HolderSnapshot,
): Promise<HolderSnapshotMeta> {
  const meta = toSnapshotMeta(snapshot);
  const body = JSON.stringify(snapshot);
  const options = {
    access: "public" as const,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  };

  await put(metaPath(snapshot.id), JSON.stringify(meta), options);
  await put(dataPath(snapshot.id), body, {
    ...options,
    multipart: body.length > 4 * 1024 * 1024,
  });
  return meta;
}
