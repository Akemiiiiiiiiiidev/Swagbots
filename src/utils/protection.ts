import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS protection_config (
      guild_id TEXT NOT NULL,
      system   TEXT NOT NULL,
      enabled  INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (guild_id, system)
    );
  `);
}

export type ProtectionSystem = "anti_link" | "channel_protection";

export function initProtection() {
  ensureTable();
}

export function setProtection(guildId: string, system: ProtectionSystem, enabled: boolean) {
  initProtection();
  getDatabase()
    .prepare(
      `INSERT INTO protection_config (guild_id, system, enabled)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id, system) DO UPDATE SET enabled = excluded.enabled`
    )
    .run(guildId, system, enabled ? 1 : 0);
}

export function isProtectionEnabled(guildId: string, system: ProtectionSystem): boolean {
  initProtection();
  const row = getDatabase()
    .prepare(`SELECT enabled FROM protection_config WHERE guild_id = ? AND system = ?`)
    .get(guildId, system) as { enabled: number } | undefined;
  // Se não existe registro, padrão é ATIVADO
  return (row?.enabled ?? 1) === 1;
}
