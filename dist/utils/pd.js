"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPd = initPd;
exports.setPdRole = setPdRole;
exports.getPdRoleId = getPdRoleId;
exports.addPdAllowedUser = addPdAllowedUser;
exports.removePdAllowedUser = removePdAllowedUser;
exports.isPdAllowedUser = isPdAllowedUser;
exports.getPdAllowedUsers = getPdAllowedUsers;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
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
function initPd() {
    ensureTable();
}
// ── Cargo ─────────────────────────────────────────────────────────────────────
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
// ── Usuários permitidos ───────────────────────────────────────────────────────
function addPdAllowedUser(guildId, userId) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT OR IGNORE INTO pd_allowed_users (guild_id, user_id) VALUES (?, ?)`)
        .run(guildId, userId);
}
function removePdAllowedUser(guildId, userId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM pd_allowed_users WHERE guild_id = ? AND user_id = ?`)
        .run(guildId, userId);
}
function isPdAllowedUser(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT 1 FROM pd_allowed_users WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row !== undefined;
}
function getPdAllowedUsers(guildId) {
    const rows = (0, database_1.getDatabase)()
        .prepare(`SELECT user_id FROM pd_allowed_users WHERE guild_id = ?`)
        .all(guildId);
    return rows.map((r) => r.user_id);
}
//# sourceMappingURL=pd.js.map