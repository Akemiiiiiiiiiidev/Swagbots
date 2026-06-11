"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initColeira = initColeira;
exports.setColeira = setColeira;
exports.removeColeira = removeColeira;
exports.getColeira = getColeira;
exports.hasColeira = hasColeira;
exports.removeColeiraByExecutor = removeColeiraByExecutor;
exports.listColeirasByExecutor = listColeirasByExecutor;
exports.getAllColeiras = getAllColeiras;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS coleira (
      guild_id    TEXT NOT NULL,
      target_id   TEXT NOT NULL,
      executor_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, target_id)
    );
  `);
}
function initColeira() {
    ensureTable();
}
function setColeira(guildId, targetId, executorId) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO coleira (guild_id, target_id, executor_id) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, target_id) DO UPDATE SET executor_id = excluded.executor_id`)
        .run(guildId, targetId, executorId);
}
function removeColeira(guildId, targetId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM coleira WHERE guild_id = ? AND target_id = ?`)
        .run(guildId, targetId);
}
function getColeira(guildId, targetId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT executor_id FROM coleira WHERE guild_id = ? AND target_id = ?`)
        .get(guildId, targetId);
    return row?.executor_id ?? null;
}
function hasColeira(guildId, targetId) {
    return getColeira(guildId, targetId) !== null;
}
function removeColeiraByExecutor(guildId, executorId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM coleira WHERE guild_id = ? AND executor_id = ?`)
        .run(guildId, executorId);
}
function listColeirasByExecutor(guildId, executorId) {
    const rows = (0, database_1.getDatabase)()
        .prepare(`SELECT target_id FROM coleira WHERE guild_id = ? AND executor_id = ?`)
        .all(guildId, executorId);
    return rows.map((r) => r.target_id);
}
function getAllColeiras(guildId) {
    const rows = (0, database_1.getDatabase)()
        .prepare(`SELECT target_id, executor_id FROM coleira WHERE guild_id = ?`)
        .all(guildId);
    return rows.map((r) => ({ targetId: r.target_id, executorId: r.executor_id }));
}
//# sourceMappingURL=coleira.js.map