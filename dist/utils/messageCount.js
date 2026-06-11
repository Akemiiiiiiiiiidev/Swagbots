"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeekStartDate = getWeekStartDate;
exports.getNextSundayTimestamp = getNextSundayTimestamp;
exports.incrementMessageCount = incrementMessageCount;
exports.getUserMessageCount = getUserMessageCount;
exports.getTopMessageCounts = getTopMessageCounts;
exports.cleanupOldWeeks = cleanupOldWeeks;
exports.startWeeklyResetScheduler = startWeeklyResetScheduler;
const database_1 = require("../database");
function getWeekStartDate(date = new Date()) {
    const sunday = new Date(date);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(date.getDate() - date.getDay());
    return sunday.toISOString().slice(0, 10);
}
function getNextSundayTimestamp(date = new Date()) {
    const nextSunday = new Date(date);
    nextSunday.setHours(0, 0, 0, 0);
    const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
    nextSunday.setDate(date.getDate() + daysUntilSunday);
    return Math.floor(nextSunday.getTime() / 1000);
}
function incrementMessageCount(guildId, userId) {
    const db = (0, database_1.getDatabase)();
    const weekStart = getWeekStartDate();
    db.prepare(`
    INSERT INTO message_counts (guild_id, user_id, week_start, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, week_start)
    DO UPDATE SET count = count + 1
  `).run(guildId, userId, weekStart);
}
function getUserMessageCount(guildId, userId) {
    const db = (0, database_1.getDatabase)();
    const weekStart = getWeekStartDate();
    const row = db
        .prepare(`
    SELECT count
    FROM message_counts
    WHERE guild_id = ? AND user_id = ? AND week_start = ?
  `)
        .get(guildId, userId, weekStart);
    return row?.count ?? 0;
}
function getTopMessageCounts(guildId, limit = 5) {
    const db = (0, database_1.getDatabase)();
    const weekStart = getWeekStartDate();
    return db
        .prepare(`
    SELECT user_id as userId, count
    FROM message_counts
    WHERE guild_id = ? AND week_start = ?
    ORDER BY count DESC
    LIMIT ?
  `)
        .all(guildId, weekStart, limit);
}
function cleanupOldWeeks() {
    const db = (0, database_1.getDatabase)();
    const currentWeek = getWeekStartDate();
    const result = db
        .prepare(`DELETE FROM message_counts WHERE week_start < ?`)
        .run(currentWeek);
    if (result.changes > 0) {
        console.log(`Contador de mensagens: ${result.changes} registro(s) antigo(s) removido(s).`);
    }
}
function startWeeklyResetScheduler() {
    cleanupOldWeeks();
    setInterval(() => {
        cleanupOldWeeks();
    }, 60 * 60 * 1000);
}
//# sourceMappingURL=messageCount.js.map