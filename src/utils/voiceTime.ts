import type { Client, VoiceState } from "discord.js";
import { getDatabase } from "../database";

// Sessões ativas ficam em memória (sessionStart não precisa persistir entre reinícios
// porque ao iniciar o bot, syncActiveVoiceSessions reconstrói as sessões)
const activeSessions = new Map<string, number>(); // `${guildId}:${userId}` -> sessionStart (ms)

function sessionKey(guildId: string, userId: string) {
  return `${guildId}:${userId}`;
}

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS voice_time (
      guild_id TEXT NOT NULL,
      user_id  TEXT NOT NULL,
      total_ms INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}

export function initVoiceTime() {
  ensureTable();
}

export function formatVoiceDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
}

function getStoredTotal(guildId: string, userId: string): number {
  const row = getDatabase()
    .prepare(`SELECT total_ms FROM voice_time WHERE guild_id = ? AND user_id = ?`)
    .get(guildId, userId) as { total_ms: number } | undefined;
  return row?.total_ms ?? 0;
}

function addToTotal(guildId: string, userId: string, ms: number) {
  getDatabase()
    .prepare(
      `INSERT INTO voice_time (guild_id, user_id, total_ms) VALUES (?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET total_ms = total_ms + excluded.total_ms`
    )
    .run(guildId, userId, ms);
}

export function getVoiceTime(guildId: string, userId: string): number {
  const stored = getStoredTotal(guildId, userId);
  const key = sessionKey(guildId, userId);
  const sessionStart = activeSessions.get(key);
  return sessionStart ? stored + (Date.now() - sessionStart) : stored;
}

export function getTopVoiceTimes(guildId: string, limit = 5): { userId: string; totalMs: number }[] {
  const rows = getDatabase()
    .prepare(`SELECT user_id as userId, total_ms as totalMs FROM voice_time WHERE guild_id = ? ORDER BY total_ms DESC`)
    .all(guildId) as { userId: string; totalMs: number }[];

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
    if (kGuildId !== guildId) continue;
    if (merged.some((r) => r.userId === userId)) continue;
    merged.push({ userId, totalMs: Date.now() - sessionStart });
  }

  return merged
    .filter((r) => r.totalMs > 0)
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, limit);
}

export function isInVoiceCall(guildId: string, userId: string): boolean {
  return activeSessions.has(sessionKey(guildId, userId));
}

function startSession(guildId: string, userId: string) {
  const key = sessionKey(guildId, userId);
  if (!activeSessions.has(key)) {
    activeSessions.set(key, Date.now());
  }
}

function endSession(guildId: string, userId: string) {
  const key = sessionKey(guildId, userId);
  const sessionStart = activeSessions.get(key);
  if (!sessionStart) return;
  activeSessions.delete(key);
  const elapsed = Date.now() - sessionStart;
  if (elapsed > 0) addToTotal(guildId, userId, elapsed);
}

export function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  if (newState.member?.user.bot) return;
  const guildId = newState.guild.id;
  const userId = newState.id;
  const wasInCall = oldState.channelId !== null;
  const isInCall = newState.channelId !== null;

  if (wasInCall && !isInCall) { endSession(guildId, userId); return; }
  if (!wasInCall && isInCall) { startSession(guildId, userId); return; }
  if (wasInCall && isInCall && oldState.channelId !== newState.channelId) {
    endSession(guildId, userId);
    startSession(guildId, userId);
  }
}

export function syncActiveVoiceSessions(client: Client) {
  for (const guild of client.guilds.cache.values()) {
    for (const state of guild.voiceStates.cache.values()) {
      if (!state.channelId || state.member?.user.bot) continue;
      startSession(guild.id, state.id);
    }
  }
}
