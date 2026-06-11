import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEditOrganized, E } from "../utils/container";
import {
  getNextSundayTimestamp,
  getTopMessageCounts,
  getUserMessageCount,
} from "../utils/messageCount";

const LIVE_UPDATE_MS = 5000;
const LIVE_UPDATE_DURATION_MS = 120_000;

function buildTopRanking(guildId: string): string {
  const top = getTopMessageCounts(guildId, 5);

  if (top.length === 0) {
    return `${E} Nenhuma mensagem registrada nesta semana.`;
  }

  return top
    .map(
      (entry, index) =>
        `${E} **${index + 1}.** <@${entry.userId}> - **${entry.count}** mensagens`
    )
    .join("\n");
}

function buildMensagensSections(guildId: string, targetUserId: string) {
  const count = getUserMessageCount(guildId, targetUserId);
  const nextReset = getNextSundayTimestamp();

  return [
    "# **MENSAGENS**",
    [
      `${E} **Usuario:** <@${targetUserId}>`,
      `${E} **Mensagens esta semana:** ${count}`,
      `${E} **Proximo reset:** <t:${nextReset}:R> (domingo)`,
    ].join("\n"),
    [`${E} **TOP 5**`, buildTopRanking(guildId)].join("\n"),
  ];
}

export const mensagens: Command = {
  defer: true,

  data: new SlashCommandBuilder()
    .setName("mensagens")
    .setDescription("Mostra contagem de mensagens da semana e o top 5")
    .addUserOption((option) =>
      option.setName("membro").setDescription("Membro para consultar").setRequired(false)
    ),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply(
        containerEditOrganized([`${E} Este comando so pode ser usado em um servidor.`])
      );
      return;
    }

    const target = interaction.options.getUser("membro") ?? interaction.user;

    const updateMessage = async () => {
      await interaction.editReply(
        containerEditOrganized(buildMensagensSections(guild.id, target.id))
      );
    };

    await updateMessage();

    const interval = setInterval(async () => {
      try {
        await updateMessage();
      } catch {
        clearInterval(interval);
      }
    }, LIVE_UPDATE_MS);

    setTimeout(() => clearInterval(interval), LIVE_UPDATE_DURATION_MS);
  },
};
