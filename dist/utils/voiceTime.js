"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initVoiceTime = initVoiceTime;
exports.formatVoiceDuration = formatVoiceDuration;
exports.getVoiceTime = getVoiceTime;
exports.getTopVoiceTimes = getTopVoiceTimes;
exports.isInVoiceCall = isInVoiceCall;
exports.handleVoiceStateUpdate = handleVoiceStateUpdate;
exports.syncActiveVoiceSessions = syncActiveVoiceSessions;
const database_1 = require("../database");
// Sessões ativas ficam em memória (sessionStart não precisa persistir entre reinícios
// porque ao iniciar o bot, syncActiveVoiceSessions reconstrói as sessões)
const activeSessions = new Map(); // `${guildId}:${userId}` -> sessionStart (ms)
function sessionKey(guildId, userId) {
    return `${guildId}:${userId}`;
}
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS voice_time (
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      total_ms INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}
function initVoiceTime() {
    ensureTable();
}
function formatVoiceDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
}
function getStoredTotal(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT total_ms FROM voice_time WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row?.total_ms ?? 0;
}
function addToTotal(guildId, userId, ms) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO voice_time (guild_id, user_id, total_ms) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET total_ms = total_ms + excluded.total_ms`)
        .run(guildId, userId, ms);
}
function getVoiceTime(guildId, userId) {
    const stored = getStoredTotal(guildId, userId);
    const key = sessionKey(guildId, userId);
    const sessionStart = activeSessions.get(key);
    return sessionStart ? stored + (Date.now() - sessionStart) : stored;
}
function getTopVoiceTimes(guildId, limit = 5) {
    const rows = (0, database_1.getDatabase)()
        .prepare(`SELECT user_id as userId, total_ms as totalMs FROM voice_time WHERE guild_id = ? ORDER BY total_ms DESC`)
        .all(guildId);
    // Soma o tempo de sessão ativa para quem está em call agora
    const merged = rows.map((row) => {
        const key = sessionKey(guildId, row.userId);
        const sessionStart = activeSessions.get(key);
        return {
            userId: row.userId,
            totalMs: sessionStart ? row.totalMs + (Date.now() - sessionStart) : row.totalMs,
        };
    });
    // Adiciona usuários em call que ainda não têm registro no banco
    for (const [key, sessionStart] of activeSessions.entries()) {
        const [kGuildId, userId] = key.split(":");
        if (kGuildId !== guildId)
            continue;
        if (merged.some((r) => r.userId === userId))
            continue;
        merged.push({ userId, totalMs: Date.now() - sessionStart });
    }
    return merged
        .filter((r) => r.totalMs > 0)
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, limit);
}
function isInVoiceCall(guildId, userId) {
    return activeSessions.has(sessionKey(guildId, userId));
}
function startSession(guildId, userId) {
    const key = sessionKey(guildId, userId);
    if (!activeSessions.has(key)) {
        activeSessions.set(key, Date.now());
    }
}
function endSession(guildId, userId) {
    const key = sessionKey(guildId, userId);
    const sessionStart = activeSessions.get(key);
    if (!sessionStart)
        return;
    activeSessions.delete(key);
    const elapsed = Date.now() - sessionStart;
    if (elapsed > 0)
        addToTotal(guildId, userId, elapsed);
}
function handleVoiceStateUpdate(oldState, newState) {
    if (newState.member?.user.bot)
        return;
    const guildId = newState.guild.id;
    const userId = newState.id;
    const wasInCall = oldState.channelId !== null;
    const isInCall = newState.channelId !== null;
    if (wasInCall && !isInCall) {
        endSession(guildId, userId);
        return;
    }
    if (!wasInCall && isInCall) {
        startSession(guildId, userId);
        return;
    }
    if (wasInCall && isInCall && oldState.channelId !== newState.channelId) {
        endSession(guildId, userId);
        startSession(guildId, userId);
    }
}
function syncActiveVoiceSessions(client) {
    for (const guild of client.guilds.cache.values()) {
        for (const state of guild.voiceStates.cache.values()) {
            if (!state.channelId || state.member?.user.bot)
                continue;
            startSession(guild.id, state.id);
        }
    }
}
//# sourceMappingURL=voiceTime.js.map