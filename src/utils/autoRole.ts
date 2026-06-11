import { GuildMember, Role } from "discord.js";
import { getDatabase } from "../database";

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS auto_role_config (
      guild_id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL
    );
  `);
}

export function initAutoRole() {
  ensureTable();
}

export function setAutoRole(guildId: string, roleId: string) {
  initAutoRole();
  getDatabase()
    .prepare(
      `
    INSERT INTO auto_role_config (guild_id, role_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id
  `
    )
    .run(guildId, roleId);
}

export function getAutoRoleId(guildId: string): string | null {
  initAutoRole();
  const row = getDatabase()
    .prepare(`SELECT role_id as roleId FROM auto_role_config WHERE guild_id = ?`)
    .get(guildId) as { roleId: string } | undefined;

  return row?.roleId ?? null;
}

export function clearAutoRole(guildId: string) {
  initAutoRole();
  getDatabase()
    .prepare(`DELETE FROM auto_role_config WHERE guild_id = ?`)
    .run(guildId);
}

export async function resolveAutoRole(
  member: GuildMember
): Promise<Role | null> {
  const roleId = getAutoRoleId(member.guild.id);
  if (!roleId) return null;

  return (
    member.guild.roles.cache.get(roleId) ??
    (await member.guild.roles.fetch(roleId).catch(() => null))
  );
}

export async function assignAutoRole(member: GuildMember) {
  const role = await resolveAutoRole(member);

  if (!role) {
    return { success: false as const, error: "Cargo automatico nao configurado." };
  }

  if (member.roles.cache.has(role.id)) {
    return { success: false as const, error: "O membro ja possui este cargo." };
  }

  const botMember = member.guild.members.me;
  if (!botMember) {
    return {
      success: false as const,
      error: "Nao foi possivel verificar as permissoes do bot.",
    };
  }

  if (
    role.position >= botMember.roles.highest.position &&
    member.guild.ownerId !== botMember.id
  ) {
    return {
      success: false as const,
      error: "O cargo automatico esta acima do meu cargo na hierarquia.",
    };
  }

  try {
    await member.roles.add(role, "Cargo automatico");
    return { success: true as const, role };
  } catch {
    return {
      success: false as const,
      error: "Nao foi possivel adicionar o cargo ao membro.",
    };
  }
}
