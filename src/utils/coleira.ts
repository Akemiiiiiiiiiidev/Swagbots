import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS coleira (
      guild_id    TEXT NOT NULL,
      target_id   TEXT NOT NULL,
      executor_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, target_id)
    );
  `);
}

export function initColeira() {
  ensureTable();
}

export function setColeira(guildId: string, targetId: string, executorId: string) {
  getDatabase()
    .prepare(
      `INSERT INTO coleira (guild_id, target_id, executor_id) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, target_id) DO UPDATE SET executor_id = excluded.executor_id`
    )
    .run(guildId, targetId, executorId);
}

export function removeColeira(guildId: string, targetId: string) {
  getDatabase()
    .prepare(`DELETE FROM coleira WHERE guild_id = ? AND target_id = ?`)
    .run(guildId, targetId);
}

export function getColeira(guildId: string, targetId: string): string | null {
  const row = getDatabase()
    .prepare(`SELECT executor_id FROM coleira WHERE guild_id = ? AND target_id = ?`)
    .get(guildId, targetId) as { executor_id: string } | undefined;
  return row?.executor_id ?? null;
}

export function hasColeira(guildId: string, targetId: string): boolean {
  return getColeira(guildId, targetId) !== null;
}

export function removeColeiraByExecutor(guildId: string, executorId: string) {
  getDatabase()
    .prepare(`DELETE FROM coleira WHERE guild_id = ? AND executor_id = ?`)
    .run(guildId, executorId);
}

export function listColeirasByExecutor(guildId: string, executorId: string): string[] {
  const rows = getDatabase()
    .prepare(`SELECT target_id FROM coleira WHERE guild_id = ? AND executor_id = ?`)
    .all(guildId, executorId) as { target_id: string }[];
  return rows.map((r) => r.target_id);
}

export function getAllColeiras(guildId: string): { targetId: string; executorId: string }[] {
  const rows = getDatabase()
    .prepare(`SELECT target_id, executor_id FROM coleira WHERE guild_id = ?`)
    .all(guildId) as { target_id: string; executor_id: string }[];
  return rows.map((r) => ({ targetId: r.target_id, executorId: r.executor_id }));
}
