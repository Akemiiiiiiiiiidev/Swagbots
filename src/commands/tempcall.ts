import { Guild, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEdit, containerEditOrganized } from "../utils/container";
import { formatVoiceDuration, getTopVoiceTimes, getVoiceTime } from "../utils/voiceTime";

const LIVE_UPDATE_MS = 1000;
const LIVE_UPDATE_DURATION_MS = 120_000;

function getCallName(guild: Guild, userId: string): string {
  const channel = guild.voiceStates.cache.get(userId)?.channel;
  return channel?.name ?? "Fora de call";
}

function buildTopRanking(guildId: string): string {
  const top = getTopVoiceTimes(guildId, 5);

  if (top.length === 0) {
    return `Nenhum tempo registrado ainda.`;
  }

  return top
    .map(
      (entry, index) =>
        `**${index + 1}.** <@${entry.userId}> - ${formatVoiceDuration(entry.totalMs)}`
    )
    .join("\n");
}

function buildTempcallSections(guild: Guild, targetUserId: string) {
  const totalMs = getVoiceTime(guild.id, targetUserId);

  return [
    "# **TEMPO**",
    [
      `**Usuário:** <@${targetUserId}>`,
      `**Tempo total:** ${formatVoiceDuration(totalMs)}`,
      `**Call:** ${getCallName(guild, targetUserId)}`,
    ].join("\n"),
    [`**TOP 5**`, buildTopRanking(guild.id)].join("\n"),
  ];
}

export const tempcall: Command = {
  defer: true,

  data: new SlashCommandBuilder()
    .setName("tempcall")
    .setDescription("Mostra seu tempo em call e o top 5 do servidor")
    .addUserOption((option) =>
      option.setName("membro").setDescription("Membro para consultar").setRequired(false)
    ),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply(
        containerEdit(`Este comando só pode ser usado em um servidor.`)
      );
      return;
    }

    const target = interaction.options.getUser("membro") ?? interaction.user;

    const updateMessage = async () => {
      await interaction.editReply(
        containerEditOrganized(buildTempcallSections(guild, target.id))
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
