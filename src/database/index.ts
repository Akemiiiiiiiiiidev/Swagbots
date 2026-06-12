import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";

type SqliteDatabase = Database.Database;

const DATA_DIR = join(process.cwd(), "data");
const DB_FILE = join(DATA_DIR, "bot.db");

let db: SqliteDatabase | null = null;

function runMigrations(database: SqliteDatabase) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS message_counts (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      week_start TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id, week_start)
    );

    CREATE INDEX IF NOT EXISTS idx_message_counts_ranking
    ON message_counts (guild_id, week_start, count DESC);

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      reason    TEXT NOT NULL DEFAULT '',
      added_by  TEXT NOT NULL DEFAULT '',
      added_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      category   TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_channel
    ON tickets (channel_id);

    CREATE TABLE IF NOT EXISTS voice_time (
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      total_ms   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS coleira (
      guild_id    TEXT NOT NULL,
      target_id   TEXT NOT NULL,
      executor_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, target_id)
    );

    CREATE TABLE IF NOT EXISTS pd_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pd_allowed_roles (
      guild_id TEXT NOT NULL,
      role_id  TEXT NOT NULL,
      PRIMARY KEY (guild_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS pd_holders (
      guild_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      granted_by  TEXT NOT NULL,
      granted_at  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS protection_config (
      guild_id TEXT NOT NULL,
      system   TEXT NOT NULL,
      enabled  INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (guild_id, system)
    );
  `);
}

export function initDatabase(): SqliteDatabase {
  if (db) return db;

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  console.log(`Banco de dados conectado: ${DB_FILE}`);
  return db;
}

export function getDatabase(): SqliteDatabase {
  if (!db) {
    return initDatabase();
  }

  return db;
}

export function closeDatabase() {
  if (!db) return;

  db.close();
  db = null;
}
