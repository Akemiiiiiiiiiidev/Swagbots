import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS pd_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pd_allowed_roles (
      guild_id TEXT NOT NULL,
      role_id  TEXT NOT NULL,
      PRIMARY KEY (guild_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS pd_holders (
      guild_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      granted_by  TEXT NOT NULL,
      granted_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}

export function initPd() {
  ensureTable();
}

// ── Cargo de Primeira Dama ────────────────────────────────────────────────────

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

// ── Cargos com acesso ao /pd ──────────────────────────────────────────────────

export function addPdAllowedRole(guildId: string, roleId: string) {
  getDatabase()
    .prepare(`INSERT OR IGNORE INTO pd_allowed_roles (guild_id, role_id) VALUES (?, ?)`)
    .run(guildId, roleId);
}

export function clearPdAllowedRoles(guildId: string) {
  getDatabase()
    .prepare(`DELETE FROM pd_allowed_roles WHERE guild_id = ?`)
    .run(guildId);
}

export function getPdAllowedRoles(guildId: string): string[] {
  const rows = getDatabase()
    .prepare(`SELECT role_id FROM pd_allowed_roles WHERE guild_id = ?`)
    .all(guildId) as { role_id: string }[];
  return rows.map((r) => r.role_id);
}

export function memberHasPdAccess(guildId: string, memberRoleIds: string[]): boolean {
  const allowed = getPdAllowedRoles(guildId);
  return memberRoleIds.some((id) => allowed.includes(id));
}

// ── Titulares por executor (máx 2 por membro com acesso) ─────────────────────

export const PD_MAX_PER_EXECUTOR = 2;

export interface PdHolder {
  userId: string;
  grantedBy: string;
  grantedAt: number;
}

export function getPdHoldersByExecutor(guildId: string, executorId: string): PdHolder[] {
  return getDatabase()
    .prepare(
      `SELECT user_id as userId, granted_by as grantedBy, granted_at as grantedAt
       FROM pd_holders WHERE guild_id = ? AND granted_by = ? ORDER BY granted_at ASC`
    )
    .all(guildId, executorId) as PdHolder[];
}

export function getPdHolderCountByExecutor(guildId: string, executorId: string): number {
  const row = getDatabase()
    .prepare(`SELECT COUNT(*) as count FROM pd_holders WHERE guild_id = ? AND granted_by = ?`)
    .get(guildId, executorId) as { count: number };
  return row.count;
}

export function getAllPdHolders(guildId: string): PdHolder[] {
  return getDatabase()
    .prepare(
      `SELECT user_id as userId, granted_by as grantedBy, granted_at as grantedAt
       FROM pd_holders WHERE guild_id = ? ORDER BY granted_at ASC`
    )
    .all(guildId) as PdHolder[];
}

export function addPdHolder(guildId: string, userId: string, grantedBy: string) {
  getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO pd_holders (guild_id, user_id, granted_by, granted_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(guildId, userId, grantedBy, Date.now());
}

export function removePdHolder(guildId: string, userId: string) {
  getDatabase()
    .prepare(`DELETE FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
    .run(guildId, userId);
}

export function isPdHolder(guildId: string, userId: string): boolean {
  const row = getDatabase()
    .prepare(`SELECT 1 FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
    .get(guildId, userId);
  return row !== undefined;
}

export function getPdHolderGrantedBy(guildId: string, userId: string): string | null {
  const row = getDatabase()
    .prepare(`SELECT granted_by FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
    .get(guildId, userId) as { granted_by: string } | undefined;
  return row?.granted_by ?? null;
}
