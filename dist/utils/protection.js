"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initProtection = initProtection;
exports.setProtection = setProtection;
exports.isProtectionEnabled = isProtectionEnabled;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS protection_config (
      guild_id TEXT NOT NULL,
      system   TEXT NOT NULL,
      enabled  INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (guild_id, system)
    );
  `);
}
function initProtection() {
    ensureTable();
}
function setProtection(guildId, system, enabled) {
    initProtection();
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO protection_config (guild_id, system, enabled)
       VALUES (?, ?, ?)
       ON CONFLICT(guild_id, system) DO UPDATE SET enabled = excluded.enabled`)
        .run(guildId, system, enabled ? 1 : 0);
}
function isProtectionEnabled(guildId, system) {
    initProtection();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT enabled FROM protection_config WHERE guild_id = ? AND system = ?`)
        .get(guildId, system);
    // Se não existe registro, padrão é ATIVADO
    return (row?.enabled ?? 1) === 1;
}
//# sourceMappingURL=protection.js.map