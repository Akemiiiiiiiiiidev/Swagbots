import { GuildMember } from "discord.js";
import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS antiban_config (
      guild_id TEXT PRIMARY KEY,
      role_id  TEXT NOT NULL
    );
  `);
}

export function initAntiban() {
  ensureTable();
}

export function setAntiban(guildId: string, roleId: string) {
  initAntiban();
  getDatabase()
    .prepare(
      `INSERT INTO antiban_config (guild_id, role_id) VALUES (?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id`
    )
    .run(guildId, roleId);
}

export function getAntibanRoleId(guildId: string): string | null {
  initAntiban();
  const row = getDatabase()
    .prepare(`SELECT role_id as roleId FROM antiban_config WHERE guild_id = ?`)
    .get(guildId) as { roleId: string } | undefined;
  return row?.roleId ?? null;
}

export function clearAntiban(guildId: string) {
  initAntiban();
  getDatabase()
    .prepare(`DELETE FROM antiban_config WHERE guild_id = ?`)
    .run(guildId);
}

export function isAntibanProtected(member: GuildMember): boolean {
  const roleId = getAntibanRoleId(member.guild.id);
  if (!roleId) return false;
  return member.roles.cache.has(roleId);
}
