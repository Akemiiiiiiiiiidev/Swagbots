import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReply } from "../utils/container";

export const user: Command = {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Mostra informações sobre você ou outro membro")
    .addUserOption((option) =>
      option.setName("membro").setDescription("Membro para consultar").setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("membro") ?? interaction.user;
    const member = interaction.guild?.members.cache.get(target.id);

    await interaction.reply(
      containerReply(
        [
          `**Usuário:** ${target.tag}`,
          `**ID:** ${target.id}`,
          `**Conta criada:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
          member
            ? `**Entrou no servidor:** <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      )
    );
  },
};
