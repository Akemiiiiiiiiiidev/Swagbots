"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBlacklist = initBlacklist;
exports.isBlacklisted = isBlacklisted;
exports.addToBlacklist = addToBlacklist;
exports.removeFromBlacklist = removeFromBlacklist;
exports.getBlacklistUsers = getBlacklistUsers;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      reason    TEXT NOT NULL DEFAULT '',
      added_by  TEXT NOT NULL DEFAULT '',
      added_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}
function initBlacklist() {
    ensureTable();
}
function isBlacklisted(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT 1 FROM blacklist WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row !== undefined;
}
function addToBlacklist(guildId, userId, reason, addedBy) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO blacklist (guild_id, user_id, reason, added_by, added_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
         reason   = excluded.reason,
         added_by = excluded.added_by,
         added_at = excluded.added_at`)
        .run(guildId, userId, reason, addedBy, Date.now());
}
function removeFromBlacklist(guildId, userId) {
    const result = (0, database_1.getDatabase)()
        .prepare(`DELETE FROM blacklist WHERE guild_id = ? AND user_id = ?`)
        .run(guildId, userId);
    return result.changes > 0;
}
function getBlacklistUsers(guildId) {
    return (0, database_1.getDatabase)()
        .prepare(`SELECT user_id as userId, reason, added_by as addedBy, added_at as addedAt
         FROM blacklist WHERE guild_id = ? ORDER BY added_at DESC`)
        .all(guildId);
}
//# sourceMappingURL=blacklist.js.map