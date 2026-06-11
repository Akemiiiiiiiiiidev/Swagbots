import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEditOrganized, containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { LOG_TYPES, setupLogChannels } from "../utils/logs";

export const logs: Command = {
  data: new SlashCommandBuilder()
    .setName("logs").setDescription("Configura o sistema de logs do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("criar").setDescription("Cria os canais de log automaticamente")),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) { await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })); return; }
    const adminError = await checkAdministrator(interaction);
    if (adminError) { await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true })); return; }
    if (interaction.options.getSubcommand() !== "criar") return;
    await interaction.deferReply({ ephemeral: true });
    const channels = await setupLogChannels(guild);
    await interaction.editReply(
      containerEditOrganized([
        "# **LOGS**",
        [
          `${V} **Canais criados**`,
          `${E} **Categoria:** LOGS`,
          `${E} **Administrador:** <@${interaction.user.id}>`,
          "",
          `${E} **Canais:**`,
          channels.join("\n"),
          "",
          `${E} **Tipos:**`,
          Object.values(LOG_TYPES).map((c) => `${E} **${c.title}:** #${c.channel}`).join("\n"),
        ].join("\n"),
        `${E} O bot registrara comandos e acoes automaticamente nestes canais.`,
      ])
    );
  },
};
