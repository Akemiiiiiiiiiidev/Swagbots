import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEdit, containerReply } from "../utils/container";

export const ping: Command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Verifica a latência do bot"),

  async execute(interaction) {
    const { resource } = await interaction.reply({ ...containerReply(`Calculando ping...`), withResponse: true });
    const sent = resource!.message!;
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    await interaction.editReply(
      containerEdit(`Pong\nLatência: **${latency}ms**\nAPI: **${apiLatency}ms**`)
    );
  },
};
