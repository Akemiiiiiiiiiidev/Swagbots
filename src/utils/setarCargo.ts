import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS setar_cargo_protection (
      guild_id TEXT PRIMARY KEY,
      enabled  INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function initSetarCargo() {
  ensureTable();
}

export function setSetarCargoProtection(guildId: string, enabled: boolean) {
  initSetarCargo();
  getDatabase()
    .prepare(
      `INSERT INTO setar_cargo_protection (guild_id, enabled)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET enabled = excluded.enabled`
    )
    .run(guildId, enabled ? 1 : 0);
}

export function isSetarCargoProtectionEnabled(guildId: string): boolean {
  initSetarCargo();
  const row = getDatabase()
    .prepare(`SELECT enabled FROM setar_cargo_protection WHERE guild_id = ?`)
    .get(guildId) as { enabled: number } | undefined;
  return (row?.enabled ?? 0) === 1;
}
