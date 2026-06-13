import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEditList, containerEditOrganized } from "../utils/container";
import { getNextSundayTimestamp, getTopMessageCounts, getUserMessageCount } from "../utils/messageCount";

const LIVE_UPDATE_MS = 5000;
const LIVE_UPDATE_DURATION_MS = 120_000;

function buildTopRanking(guildId: string): string[] {
  const top = getTopMessageCounts(guildId, 5);
  if (top.length === 0) return ["Nenhuma mensagem registrada nesta semana."];
  return top.map((entry, index) => `**${index + 1}.** <@${entry.userId}> — **${entry.count}** mensagens`);
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
      await interaction.editReply(containerEditOrganized([`Este comando so pode ser usado em um servidor.`]));
      return;
    }
    const target = interaction.options.getUser("membro") ?? interaction.user;

    const updateMessage = async () => {
      const count = getUserMessageCount(guild.id, target.id);
      const nextReset = getNextSundayTimestamp();
      await interaction.editReply(
        containerEditList("📊 MENSAGENS", [
          { label: `Usuario`, items: [`<@${target.id}>`] },
          {
            label: `Esta semana`,
            items: [
              `Mensagens: **${count}**`,
              `Proximo reset: <t:${nextReset}:R> (domingo)`,
            ],
          },
          { label: `TOP 5`, items: buildTopRanking(guild.id) },
        ])
      );
    };

    await updateMessage();

    const interval = setInterval(async () => {
      try { await updateMessage(); } catch { clearInterval(interval); }
    }, LIVE_UPDATE_MS);

    setTimeout(() => clearInterval(interval), LIVE_UPDATE_DURATION_MS);
  },
};
