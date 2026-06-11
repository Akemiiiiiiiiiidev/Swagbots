import { Guild, GuildMember, PermissionFlagsBits, TextChannel } from "discord.js";
import { getDatabase } from "../database";

export type WelcomeConfig = {
  channelId: string;
  message: string;
};

const PLACEHOLDER_HELP = [
  "**Placeholders disponiveis:**",
  "`{usuario}` - mencao do membro",
  "`{servidor}` - nome do servidor",
  "`{membros}` - total de membros",
].join("\n");

function ensureTable() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS welcome_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL
    );
  `);
}

export function initWelcome() {
  ensureTable();
}

export function setWelcomeConfig(
  guildId: string,
  channelId: string,
  message: string
) {
  initWelcome();
  getDatabase()
    .prepare(
      `
    INSERT INTO welcome_config (guild_id, channel_id, message)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      message = excluded.message
  `
    )
    .run(guildId, channelId, message);
}

export function getWelcomeConfig(guildId: string): WelcomeConfig | null {
  initWelcome();
  const row = getDatabase()
    .prepare(
      `
    SELECT channel_id as channelId, message
    FROM welcome_config
    WHERE guild_id = ?
  `
    )
    .get(guildId) as WelcomeConfig | undefined;

  return row ?? null;
}

export function clearWelcomeConfig(guildId: string) {
  initWelcome();
  getDatabase()
    .prepare(`DELETE FROM welcome_config WHERE guild_id = ?`)
    .run(guildId);
}

export function getWelcomePlaceholderHelp() {
  return PLACEHOLDER_HELP;
}

export function formatWelcomeMessage(
  template: string,
  guild: Guild,
  userId: string
) {
  return template
    .replaceAll("{usuario}", `<@${userId}>`)
    .replaceAll("{user}", `<@${userId}>`)
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{server}", guild.name)
    .replaceAll("{membros}", String(guild.memberCount));
}

export async function sendWelcomeMessage(member: GuildMember) {
  const config = getWelcomeConfig(member.guild.id);
  if (!config) return;

  const channel =
    member.guild.channels.cache.get(config.channelId) ??
    (await member.guild.channels.fetch(config.channelId).catch(() => null));

  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const textChannel = channel as TextChannel;
  const botMember = member.guild.members.me;
  if (!botMember) return;

  if (!textChannel.permissionsFor(botMember)?.has(PermissionFlagsBits.SendMessages)) {
    console.warn(
      `Sem permissao para enviar boas-vindas em ${textChannel.id} (${member.guild.id})`
    );
    return;
  }

  const content = formatWelcomeMessage(config.message, member.guild, member.id);

  await textChannel.send({ content });
}
