"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSetarCargo = initSetarCargo;
exports.setSetarCargoProtection = setSetarCargoProtection;
exports.isSetarCargoProtectionEnabled = isSetarCargoProtectionEnabled;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS setar_cargo_protection (
      guild_id TEXT PRIMARY KEY,
      enabled  INTEGER NOT NULL DEFAULT 0
    );
  `);
}
function initSetarCargo() {
    ensureTable();
}
function setSetarCargoProtection(guildId, enabled) {
    initSetarCargo();
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO setar_cargo_protection (guild_id, enabled)
       VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET enabled = excluded.enabled`)
        .run(guildId, enabled ? 1 : 0);
}
function isSetarCargoProtectionEnabled(guildId) {
    initSetarCargo();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT enabled FROM setar_cargo_protection WHERE guild_id = ?`)
        .get(guildId);
    return (row?.enabled ?? 0) === 1;
}
//# sourceMappingURL=setarCargo.js.map