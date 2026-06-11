import Database from "better-sqlite3";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "bot.db");
const JSON_FILE = join(DATA_DIR, "voice-time.json");

if (!existsSync(JSON_FILE)) {
  console.log("voice-time.json nao encontrado, nada a migrar.");
  process.exit(0);
}

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS voice_time (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    total_ms INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
`);

type VoiceTimeJson = Record<string, Record<string, { totalMs: number; sessionStart: number | null }>>;

const data = JSON.parse(readFileSync(JSON_FILE, "utf-8")) as VoiceTimeJson;

const upsert = db.prepare(`
  INSERT INTO voice_time (guild_id, user_id, total_ms)
  VALUES (?, ?, ?)
  ON CONFLICT(guild_id, user_id) DO UPDATE SET
    total_ms = MAX(total_ms, excluded.total_ms)
`);

const migrate = db.transaction(() => {
  let count = 0;
  for (const [guildId, users] of Object.entries(data)) {
    for (const [userId, entry] of Object.entries(users)) {
      if (entry.totalMs > 0) {
        upsert.run(guildId, userId, entry.totalMs);
        count++;
      }
    }
  }
  return count;
});

const count = migrate();
console.log(`Migrados ${count} registros de voice-time do JSON para o SQLite.`);

db.close();
