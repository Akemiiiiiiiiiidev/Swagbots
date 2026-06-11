"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAntiban = initAntiban;
exports.setAntiban = setAntiban;
exports.getAntibanRoleId = getAntibanRoleId;
exports.clearAntiban = clearAntiban;
exports.isAntibanProtected = isAntibanProtected;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS antiban_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );
  `);
}
function initAntiban() {
    ensureTable();
}
function setAntiban(guildId, roleId) {
    initAntiban();
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO antiban_config (guild_id, role_id) VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id`)
        .run(guildId, roleId);
}
function getAntibanRoleId(guildId) {
    initAntiban();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT role_id as roleId FROM antiban_config WHERE guild_id = ?`)
        .get(guildId);
    return row?.roleId ?? null;
}
function clearAntiban(guildId) {
    initAntiban();
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM antiban_config WHERE guild_id = ?`)
        .run(guildId);
}
function isAntibanProtected(member) {
    const roleId = getAntibanRoleId(member.guild.id);
    if (!roleId)
        return false;
    return member.roles.cache.has(roleId);
}
//# sourceMappingURL=antiban.js.map