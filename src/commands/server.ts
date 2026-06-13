import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReply, E, V } from "../utils/container";

export const server: Command = {
  data: new SlashCommandBuilder().setName("server").setDescription("Mostra informações sobre o servidor"),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReply(`${E} Este comando só pode ser usado em um servidor.`, { ephemeral: true }));
      return;
    }
    await interaction.reply(
      containerReply(
        [
          `${V} **Servidor:** ${guild.name}`,
          `${E} **ID:** ${guild.id}`,
          `${E} **Dono:** <@${guild.ownerId}>`,
          `${E} **membros <:xxx:1514705761413107732>:** ${guild.memberCount}`,
          `${E} **Criado em:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        ].join("\n")
      )
    );
  },
};
