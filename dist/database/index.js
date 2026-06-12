"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = require("fs");
const path_1 = require("path");
const DATA_DIR = (0, path_1.join)(process.cwd(), "data");
const DB_FILE = (0, path_1.join)(DATA_DIR, "bot.db");
let db = null;
function runMigrations(database) {
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
function initDatabase() {
    if (db)
        return db;
    if (!(0, fs_1.existsSync)(DATA_DIR)) {
        (0, fs_1.mkdirSync)(DATA_DIR, { recursive: true });
    }
    db = new better_sqlite3_1.default(DB_FILE);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);
    console.log(`Banco de dados conectado: ${DB_FILE}`);
    return db;
}
function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}
function closeDatabase() {
    if (!db)
        return;
    db.close();
    db = null;
}
//# sourceMappingURL=index.js.map