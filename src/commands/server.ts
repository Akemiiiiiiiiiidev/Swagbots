import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyList, containerReplyOrganized } from "../utils/container";

export const server: Command = {
  data: new SlashCommandBuilder().setName("server").setDescription("Mostra informações sobre o servidor"),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`Este comando só pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    await interaction.reply(
      containerReplyList(`SERVIDOR — ${guild.name}`, [
        {
          label: `Informações`,
          items: [
            `ID: ${guild.id}`,
            `Dono: <@${guild.ownerId}>`,
            `Membros: ${guild.memberCount}`,
            `Criado em: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          ],
        },
      ])
    );
  },
};
