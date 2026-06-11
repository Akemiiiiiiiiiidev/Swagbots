import { getDatabase } from "../database";

export function getWeekStartDate(date = new Date()): string {
  const sunday = new Date(date);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(date.getDate() - date.getDay());
  return sunday.toISOString().slice(0, 10);
}

export function getNextSundayTimestamp(date = new Date()): number {
  const nextSunday = new Date(date);
  nextSunday.setHours(0, 0, 0, 0);

  const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
  nextSunday.setDate(date.getDate() + daysUntilSunday);

  return Math.floor(nextSunday.getTime() / 1000);
}

export function incrementMessageCount(guildId: string, userId: string) {
  const db = getDatabase();
  const weekStart = getWeekStartDate();

  db.prepare(
    `
    INSERT INTO message_counts (guild_id, user_id, week_start, count)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(guild_id, user_id, week_start)
    DO UPDATE SET count = count + 1
  `
  ).run(guildId, userId, weekStart);
}

export function getUserMessageCount(
  guildId: string,
  userId: string
): number {
  const db = getDatabase();
  const weekStart = getWeekStartDate();

  const row = db
    .prepare(
      `
    SELECT count
    FROM message_counts
    WHERE guild_id = ? AND user_id = ? AND week_start = ?
  `
    )
    .get(guildId, userId, weekStart) as { count: number } | undefined;

  return row?.count ?? 0;
}

export function getTopMessageCounts(
  guildId: string,
  limit = 5
): { userId: string; count: number }[] {
  const db = getDatabase();
  const weekStart = getWeekStartDate();

  return db
    .prepare(
      `
    SELECT user_id as userId, count
    FROM message_counts
    WHERE guild_id = ? AND week_start = ?
    ORDER BY count DESC
    LIMIT ?
  `
    )
    .all(guildId, weekStart, limit) as { userId: string; count: number }[];
}

export function cleanupOldWeeks() {
  const db = getDatabase();
  const currentWeek = getWeekStartDate();

  const result = db
    .prepare(`DELETE FROM message_counts WHERE week_start < ?`)
    .run(currentWeek);

  if (result.changes > 0) {
    console.log(
      `Contador de mensagens: ${result.changes} registro(s) antigo(s) removido(s).`
    );
  }
}

export function startWeeklyResetScheduler() {
  cleanupOldWeeks();

  setInterval(() => {
    cleanupOldWeeks();
  }, 60 * 60 * 1000);
}
