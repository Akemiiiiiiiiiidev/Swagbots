import { ChannelType, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized } from "../utils/container";
import { getUserStats, initInstagram, setInstagramChannel } from "../utils/instagram";
import { checkAdministrator } from "../utils/moderation";

export const instagram: Command = {
  data: new SlashCommandBuilder()
    .setName("instagram")
    .setDescription("Sistema de instagram do servidor")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Define o canal de publicacoes")
        .addChannelOption((option) =>
          option
            .setName("canal")
            .setDescription("Canal do instagram")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("perfil")
        .setDescription("Mostra o perfil de instagram")
        .addUserOption((option) =>
          option.setName("membro").setDescription("Membro para consultar").setRequired(false)
        )
    ),

  async execute(interaction) {
    initInstagram();

    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply(
        containerReplyOrganized(
          [`Este comando so pode ser usado em um servidor.`],
          { ephemeral: true }
        )
      );
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setup") {
      const adminError = await checkAdministrator(interaction);

      if (adminError) {
        await interaction.reply(
          containerReplyOrganized([`${adminError}`], { ephemeral: true })
        );
        return;
      }

      const channel = interaction.options.getChannel("canal", true);

      if (channel.type !== ChannelType.GuildText) {
        await interaction.reply(
          containerReplyOrganized(
            [`Selecione um canal de texto valido.`],
            { ephemeral: true }
          )
        );
        return;
      }

      setInstagramChannel(guild.id, channel.id);

      await interaction.reply(
        containerReplyOrganized([
          [
            `**Canal configurado**`,
            `**Canal:** <#${channel.id}>`,
            `**Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          `Envie uma foto nesse canal para publicar automaticamente.`,
        ])
      );
      return;
    }

    if (subcommand === "perfil") {
      const target = interaction.options.getUser("membro") ?? interaction.user;
      const stats = getUserStats(guild.id, target.id);

      await interaction.reply(
        containerReplyOrganized([
          [
            `**Perfil:** <@${target.id}>`,
            `**Publicacoes:** ${stats.posts}`,
            `**Curtidas recebidas:** ${stats.likesReceived}`,
            `**Curtidas dadas:** ${stats.likesGiven}`,
            `**Comentários:** ${stats.comments}`,
          ].join("\n"),
        ])
      );
    }
  },
};
