import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerEditOrganized, containerReplyOrganized } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { LOG_TYPES, setupLogChannels } from "../utils/logs";

export const logs: Command = {
  data: new SlashCommandBuilder()
    .setName("logs").setDescription("Configura o sistema de logs do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("criar").setDescription("Cria os canais de log automaticamente")),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) { await interaction.reply(containerReplyOrganized([`Este comando so pode ser usado em um servidor.`], { ephemeral: true })); return; }
    const adminError = await checkAdministrator(interaction);
    if (adminError) { await interaction.reply(containerReplyOrganized([`${adminError}`], { ephemeral: true })); return; }
    if (interaction.options.getSubcommand() !== "criar") return;
    await interaction.deferReply({ ephemeral: true });
    const channels = await setupLogChannels(guild);
    await interaction.editReply(
      containerEditOrganized([
        "# **LOGS**",
        [
          `**Canais criados**`,
          `**Categoria:** LOGS`,
          `**Administrador:** <@${interaction.user.id}>`,
          "",
          `**Canais:**`,
          channels.join("\n"),
          "",
          `**Tipos:**`,
          Object.values(LOG_TYPES).map((c) => `**${c.title}:** #${c.channel}`).join("\n"),
        ].join("\n"),
        `O bot registrara comandos e acoes automaticamente nestes canais.`,
      ])
    );
  },
};
