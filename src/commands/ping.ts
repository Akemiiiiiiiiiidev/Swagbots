import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEdit, containerReply, E, V } from "../utils/container";

export const ping: Command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Verifica a latência do bot"),

  async execute(interaction) {
    const sent = await interaction.reply({ ...containerReply(`${E} Calculando ping...`), fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    await interaction.editReply(
      containerEdit(`${V} Pong\n${E} Latência: **${latency}ms**\n${E} API: **${apiLatency}ms**`)
    );
  },
};
