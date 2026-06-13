import { ChannelType, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyList, containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { clearWelcomeConfig, formatWelcomeMessage, getWelcomeConfig, getWelcomePlaceholderHelp, initWelcome, setWelcomeConfig } from "../utils/welcome";

export const welcome: Command = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configura a mensagem de boas-vindas do servidor")
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("Define o canal e a mensagem de boas-vindas")
        .addChannelOption((opt) => opt.setName("canal").setDescription("Canal para enviar as boas-vindas").addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption((opt) => opt.setName("mensagem").setDescription("Mensagem de boas-vindas").setRequired(true).setMaxLength(1000))
    )
    .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra a configuracao de boas-vindas"))
    .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao de boas-vindas")),

  async execute(interaction) {
    initWelcome();
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "ver") {
      const config = getWelcomeConfig(guild.id);
      if (!config) {
        await interaction.reply(containerReplyOrganized([`${E} Nenhuma mensagem de boas-vindas configurada. Use /welcome setup.`], { ephemeral: true }));
        return;
      }
      const preview = formatWelcomeMessage(config.message, guild, interaction.user.id);
      await interaction.reply(
        containerReplyList(`${V} BOAS-VINDAS — Configuração`, [
          { label: `${E} Canal`, items: [`<#${config.channelId}>`] },
          { label: `${E} Mensagem`, items: [config.message] },
          { label: `${E} Preview`, items: [preview] },
          { label: `${E} Placeholders`, items: [getWelcomePlaceholderHelp()] },
        ])
      );
      return;
    }

    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
      return;
    }

    if (subcommand === "remover") {
      clearWelcomeConfig(guild.id);
      await interaction.reply(
        containerReplyList(`${V} BOAS-VINDAS — Removido`, [
          { label: `${E} Detalhes`, items: [`Removido por: <@${interaction.user.id}>`, "Novos membros nao receberao mais mensagem de boas-vindas."] },
        ])
      );
      return;
    }

    if (subcommand === "setup") {
      const channel = interaction.options.getChannel("canal", true);
      const message = interaction.options.getString("mensagem", true).trim();
      if (channel.type !== ChannelType.GuildText) {
        await interaction.reply(containerReplyOrganized([`${E} Selecione um canal de texto valido.`], { ephemeral: true }));
        return;
      }
      if (!message) {
        await interaction.reply(containerReplyOrganized([`${E} A mensagem de boas-vindas nao pode estar vazia.`], { ephemeral: true }));
        return;
      }
      setWelcomeConfig(guild.id, channel.id, message);
      const preview = formatWelcomeMessage(message, guild, interaction.user.id);
      await interaction.reply(
        containerReplyList(`${V} BOAS-VINDAS — Configurado`, [
          { label: `${E} Canal`, items: [`<#${channel.id}>`] },
          { label: `${E} Mensagem`, items: [message] },
          { label: `${E} Preview`, items: [preview] },
          { label: `${E} Detalhes`, items: [`Configurado por: <@${interaction.user.id}>`] },
        ])
      );
    }
  },
};
