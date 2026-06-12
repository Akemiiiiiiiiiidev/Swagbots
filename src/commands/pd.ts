import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E } from "../utils/container";
import { fetchGuildMember } from "../utils/moderation";
import { memberHasPdAccess, initPd } from "../utils/pd";
import { buildPdAdminPanel, buildPdUserPanel } from "../events/pdInteractions";

export const pd: Command = {
  data: new SlashCommandBuilder()
    .setName("pd")
    .setDescription("Abre o painel de gerenciamento da Primeira Dama"),

  async execute(interaction) {
    initPd();

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const executorMember = await fetchGuildMember(guild, interaction.user.id);
    const isAdmin        = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
    const memberRoleIds  = executorMember?.roles.cache.map((r) => r.id) ?? [];
    const hasAccess      = isAdmin || memberHasPdAccess(guild.id, memberRoleIds);

    if (!hasAccess) {
      await interaction.reply(
        containerReplyOrganized([`${E} Voce nao tem permissao para usar este painel.`], { ephemeral: true })
      );
      return;
    }

    // Admins veem painel completo (4 botões), demais veem só setar/remover (2 botões)
    const panel = isAdmin
      ? buildPdAdminPanel(guild.id)
      : buildPdUserPanel(guild.id, interaction.user.id);

    await interaction.reply({
      components: [panel],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
