import { randomUUID } from "crypto";

const downloads = new Map();
const ttlMs = 30 * 60 * 1000;

function cleanupExpiredDownloads() {
  const now = Date.now();
  for (const [id, item] of downloads.entries()) {
    if (item.expiresAt <= now) {
      downloads.delete(id);
    }
  }
}

export function registerDownload({ csv, fileName }) {
  cleanupExpiredDownloads();

  const id = randomUUID();
  downloads.set(id, {
    csv,
    fileName,
    expiresAt: Date.now() + ttlMs
  });

  return id;
}

export function getDownload(id) {
  cleanupExpiredDownloads();
  return downloads.get(id);
}
