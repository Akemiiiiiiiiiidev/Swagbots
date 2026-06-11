import {
  Client,
  Events,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { clearUserMessages } from "../utils/clearChannel";
import { nukeTextChannel } from "../utils/nukeChannel";

function canUseTrigger(
  member: GuildMember,
  botMember: GuildMember | null,
  permission: bigint
) {
  return (
    member.permissions.has(permission) &&
    Boolean(botMember?.permissions.has(permission))
  );
}

export function registerChatTriggers(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.channel.isTextBased() || message.channel.isDMBased()) return;

    const member = message.member;
    if (!member) return;

    const lower = message.content.trim().toLowerCase();
    if (lower !== "toctoc" && lower !== "toc") return;

    const channel = message.channel as TextChannel;
    const botMember = message.guild.members.me;

    if (lower === "toctoc") {
      if (!botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)) {
        return;
      }

      try {
        await message.delete().catch(() => null);
        await clearUserMessages(channel, message.author.id);
      } catch (error) {
        console.error("Erro ao apagar mensagens do usuario (toctoc):", error);
      }

      return;
    }

    if (!canUseTrigger(member, botMember, PermissionFlagsBits.ManageChannels)) {
      return;
    }

    try {
      await nukeTextChannel(channel, `Canal nukado por ${message.author.tag}`);
    } catch (error) {
      console.error("Erro ao nukar chat (toc):", error);
    }
  });
}
