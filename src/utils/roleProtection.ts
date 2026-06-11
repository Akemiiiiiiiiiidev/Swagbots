import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS role_protection (
      guild_id TEXT PRIMARY KEY,
      enabled  INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function initRoleProtection() {
  ensureTable();
}

export function setRoleProtection(guildId: string, enabled: boolean) {
  initRoleProtection();
  getDatabase()
    .prepare(
      `INSERT INTO role_protection (guild_id, enabled)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET enabled = excluded.enabled`
    )
    .run(guildId, enabled ? 1 : 0);
}

export function isRoleProtectionEnabled(guildId: string): boolean {
  initRoleProtection();
  const row = getDatabase()
    .prepare(`SELECT enabled FROM role_protection WHERE guild_id = ?`)
    .get(guildId) as { enabled: number } | undefined;

  return (row?.enabled ?? 0) === 1;
}
