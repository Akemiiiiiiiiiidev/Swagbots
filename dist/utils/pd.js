"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PD_MAX_PER_EXECUTOR = void 0;
exports.initPd = initPd;
exports.setPdRole = setPdRole;
exports.getPdRoleId = getPdRoleId;
exports.addPdAllowedRole = addPdAllowedRole;
exports.clearPdAllowedRoles = clearPdAllowedRoles;
exports.getPdAllowedRoles = getPdAllowedRoles;
exports.memberHasPdAccess = memberHasPdAccess;
exports.getPdHoldersByExecutor = getPdHoldersByExecutor;
exports.getPdHolderCountByExecutor = getPdHolderCountByExecutor;
exports.getAllPdHolders = getAllPdHolders;
exports.addPdHolder = addPdHolder;
exports.removePdHolder = removePdHolder;
exports.isPdHolder = isPdHolder;
exports.getPdHolderGrantedBy = getPdHolderGrantedBy;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
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
function initPd() {
    ensureTable();
}
// ── Cargo de Primeira Dama ────────────────────────────────────────────────────
function setPdRole(guildId, roleId) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO pd_config (guild_id, role_id)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id`)
        .run(guildId, roleId);
}
function getPdRoleId(guildId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT role_id FROM pd_config WHERE guild_id = ?`)
        .get(guildId);
    return row?.role_id ?? null;
}
// ── Cargos com acesso ao /pd ──────────────────────────────────────────────────
function addPdAllowedRole(guildId, roleId) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT OR IGNORE INTO pd_allowed_roles (guild_id, role_id) VALUES (?, ?)`)
        .run(guildId, roleId);
}
function clearPdAllowedRoles(guildId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM pd_allowed_roles WHERE guild_id = ?`)
        .run(guildId);
}
function getPdAllowedRoles(guildId) {
    const rows = (0, database_1.getDatabase)()
        .prepare(`SELECT role_id FROM pd_allowed_roles WHERE guild_id = ?`)
        .all(guildId);
    return rows.map((r) => r.role_id);
}
function memberHasPdAccess(guildId, memberRoleIds) {
    const allowed = getPdAllowedRoles(guildId);
    return memberRoleIds.some((id) => allowed.includes(id));
}
// ── Titulares por executor (máx 2 por membro com acesso) ─────────────────────
exports.PD_MAX_PER_EXECUTOR = 2;
function getPdHoldersByExecutor(guildId, executorId) {
    return (0, database_1.getDatabase)()
        .prepare(`SELECT user_id as userId, granted_by as grantedBy, granted_at as grantedAt
       FROM pd_holders WHERE guild_id = ? AND granted_by = ? ORDER BY granted_at ASC`)
        .all(guildId, executorId);
}
function getPdHolderCountByExecutor(guildId, executorId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT COUNT(*) as count FROM pd_holders WHERE guild_id = ? AND granted_by = ?`)
        .get(guildId, executorId);
    return row.count;
}
function getAllPdHolders(guildId) {
    return (0, database_1.getDatabase)()
        .prepare(`SELECT user_id as userId, granted_by as grantedBy, granted_at as grantedAt
       FROM pd_holders WHERE guild_id = ? ORDER BY granted_at ASC`)
        .all(guildId);
}
function addPdHolder(guildId, userId, grantedBy) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT OR IGNORE INTO pd_holders (guild_id, user_id, granted_by, granted_at)
       VALUES (?, ?, ?, ?)`)
        .run(guildId, userId, grantedBy, Date.now());
}
function removePdHolder(guildId, userId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
        .run(guildId, userId);
}
function isPdHolder(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT 1 FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row !== undefined;
}
function getPdHolderGrantedBy(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT granted_by FROM pd_holders WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row?.granted_by ?? null;
}
//# sourceMappingURL=pd.js.map