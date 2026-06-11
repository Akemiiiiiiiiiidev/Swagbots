"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRoleProtection = initRoleProtection;
exports.setRoleProtection = setRoleProtection;
exports.isRoleProtectionEnabled = isRoleProtectionEnabled;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS role_protection (
      guild_id TEXT PRIMARY KEY,
      enabled  INTEGER NOT NULL DEFAULT 0
    );
  `);
}
function initRoleProtection() {
    ensureTable();
}
function setRoleProtection(guildId, enabled) {
    initRoleProtection();
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO role_protection (guild_id, enabled)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET enabled = excluded.enabled`)
        .run(guildId, enabled ? 1 : 0);
}
function isRoleProtectionEnabled(guildId) {
    initRoleProtection();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT enabled FROM role_protection WHERE guild_id = ?`)
        .get(guildId);
    return (row?.enabled ?? 0) === 1;
}
//# sourceMappingURL=roleProtection.js.map