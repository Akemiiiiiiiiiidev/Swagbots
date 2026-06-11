import {
  AuditLogEvent,
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  GuildBan,
  PermissionFlagsBits,
} from "discord.js";
import { initBlacklist, isBlacklisted, removeFromBlacklist } from "../utils/blacklist";

export function registerBlacklistProtection(client: Client) {
  initBlacklist();

  client.on(Events.GuildBanRemove, async (ban: GuildBan) => {
    if (!isBlacklisted(ban.guild.id, ban.user.id)) return;

    try {
      const auditLogs = await ban.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanRemove,
      });

      const entry = auditLogs.entries.first();

      if (entry?.target?.id === ban.user.id && entry.executor) {
        if (entry.executor.id === ban.client.user?.id) return;

        if (await isExecutorAdministrator(ban.guild, entry.executor.id)) {
          removeFromBlacklist(ban.guild.id, ban.user.id);
          return;
        }
      }

      await ban.guild.members.ban(ban.user.id, {
        reason: "Usuario na blacklist - desbanimento negado",
      });
    } catch (error) {
      console.error("Erro ao proteger blacklist:", error);

      try {
        await ban.guild.members.ban(ban.user.id, {
          reason: "Usuario na blacklist - desbanimento negado",
        });
      } catch {
        // Ignora falha ao rebanir
      }
    }
  });
}

export const botIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildMessages,
] as const;

export function getBotIntents() {
  const intents: GatewayIntentBits[] = [...botIntents];

  if (process.env.MESSAGE_CONTENT_INTENT === "true") {
    intents.push(GatewayIntentBits.MessageContent);
  }

  return intents;
}

export const blacklistIntents = getBotIntents();

async function isExecutorAdministrator(guild: Guild, userId: string) {
  const member = await guild.members.fetch(userId).catch(() => null);
  return member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
}
