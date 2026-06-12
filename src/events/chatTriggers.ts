import {
  Client,
  Events,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { clearUserMessages } from "../utils/clearChannel";
import { nukeTextChannel } from "../utils/nukeChannel";
import { memberHasPdAccess, initPd } from "../utils/pd";
import { buildPdAdminPanel, buildPdUserPanel } from "./pdInteractions";

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

    const content = message.content.trim();
    const lower   = content.toLowerCase();
    const channel = message.channel as TextChannel;
    const guild   = message.guild;
    const botMember = guild.members.me;

    // ── toctoc / toc ─────────────────────────────────────────────────────────
    if (lower === "toctoc" || lower === "toc") {
      if (lower === "toctoc") {
        if (!botMember?.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)) return;
        try {
          await message.delete().catch(() => null);
          await clearUserMessages(channel, message.author.id);
        } catch (error) {
          console.error("Erro ao apagar mensagens do usuario (toctoc):", error);
        }
        return;
      }

      if (!canUseTrigger(member, botMember, PermissionFlagsBits.ManageChannels)) return;
      try {
        await nukeTextChannel(channel, `Canal nukado por ${message.author.tag}`);
      } catch (error) {
        console.error("Erro ao nukar chat (toc):", error);
      }
      return;
    }

    // ── choco!pd config — painel admin ────────────────────────────────────────
    if (lower === "choco!pd config") {
      initPd();

      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        await message.reply("Apenas administradores podem usar `choco!pd config`.");
        return;
      }

      try {
        await message.delete().catch(() => null);
      } catch { /* sem permissao */ }

      await channel.send({
        components: [buildPdAdminPanel(guild.id)],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    // ── choco!pd — painel de usuário ──────────────────────────────────────────
    if (lower === "choco!pd") {
      initPd();

      const isAdmin      = member.permissions.has(PermissionFlagsBits.Administrator);
      const memberRoleIds = member.roles.cache.map((r) => r.id);
      const hasAccess    = isAdmin || memberHasPdAccess(guild.id, memberRoleIds);

      if (!hasAccess) {
        const reply = await message.reply("Voce nao tem permissao para usar este painel.");
        setTimeout(() => reply.delete().catch(() => null), 4000);
        await message.delete().catch(() => null);
        return;
      }

      try {
        await message.delete().catch(() => null);
      } catch { /* sem permissao */ }

      // Admin usando choco!pd também vê o painel de usuário (sem config)
      const panel = buildPdUserPanel(guild.id, member.id);

      await channel.send({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }
  });
}
