import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS pd_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pd_allowed_users (
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}

export function initPd() {
  ensureTable();
}

// ── Cargo ─────────────────────────────────────────────────────────────────────

export function setPdRole(guildId: string, roleId: string) {
  getDatabase()
    .prepare(
      `INSERT INTO pd_config (guild_id, role_id)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id`
    )
    .run(guildId, roleId);
}

export function getPdRoleId(guildId: string): string | null {
  const row = getDatabase()
    .prepare(`SELECT role_id FROM pd_config WHERE guild_id = ?`)
    .get(guildId) as { role_id: string } | undefined;
  return row?.role_id ?? null;
}

// ── Usuários permitidos ───────────────────────────────────────────────────────

export function addPdAllowedUser(guildId: string, userId: string) {
  getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO pd_allowed_users (guild_id, user_id) VALUES (?, ?)`
    )
    .run(guildId, userId);
}

export function removePdAllowedUser(guildId: string, userId: string) {
  getDatabase()
    .prepare(`DELETE FROM pd_allowed_users WHERE guild_id = ? AND user_id = ?`)
    .run(guildId, userId);
}

export function isPdAllowedUser(guildId: string, userId: string): boolean {
  const row = getDatabase()
    .prepare(`SELECT 1 FROM pd_allowed_users WHERE guild_id = ? AND user_id = ?`)
    .get(guildId, userId);
  return row !== undefined;
}

export function getPdAllowedUsers(guildId: string): string[] {
  const rows = getDatabase()
    .prepare(`SELECT user_id FROM pd_allowed_users WHERE guild_id = ?`)
    .all(guildId) as { user_id: string }[];
  return rows.map((r) => r.user_id);
}
