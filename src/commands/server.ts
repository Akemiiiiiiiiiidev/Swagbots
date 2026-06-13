import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyList, containerReplyOrganized, E, V } from "../utils/container";

export const server: Command = {
  data: new SlashCommandBuilder().setName("server").setDescription("Mostra informações sobre o servidor"),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`${E} Este comando só pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    await interaction.reply(
      containerReplyList(`${V} SERVIDOR — ${guild.name}`, [
        {
          label: `${E} Informações`,
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
