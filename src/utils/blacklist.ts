import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      reason    TEXT NOT NULL DEFAULT '',
      added_by  TEXT NOT NULL DEFAULT '',
      added_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}

export function initBlacklist() {
  ensureTable();
}

export function isBlacklisted(guildId: string, userId: string): boolean {
  const row = getDatabase()
    .prepare(`SELECT 1 FROM blacklist WHERE guild_id = ? AND user_id = ?`)
    .get(guildId, userId);
  return row !== undefined;
}

export function addToBlacklist(
  guildId: string,
  userId: string,
  reason: string,
  addedBy: string
) {
  getDatabase()
    .prepare(
      `INSERT INTO blacklist (guild_id, user_id, reason, added_by, added_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
         reason   = excluded.reason,
         added_by = excluded.added_by,
         added_at = excluded.added_at`
    )
    .run(guildId, userId, reason, addedBy, Date.now());
}

export function removeFromBlacklist(guildId: string, userId: string): boolean {
  const result = getDatabase()
    .prepare(`DELETE FROM blacklist WHERE guild_id = ? AND user_id = ?`)
    .run(guildId, userId);
  return result.changes > 0;
}

export type BlacklistUser = {
  userId: string;
  reason: string;
  addedBy: string;
  addedAt: number;
};

export function getBlacklistUsers(guildId: string): BlacklistUser[] {
  return (
    getDatabase()
      .prepare(
        `SELECT user_id as userId, reason, added_by as addedBy, added_at as addedAt
         FROM blacklist WHERE guild_id = ? ORDER BY added_at DESC`
      )
      .all(guildId) as BlacklistUser[]
  );
}
