import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator, fetchGuildMember } from "../utils/moderation";
import { sendLog } from "../utils/logs";
import { isSetarCargoProtectionEnabled, setSetarCargoProtection } from "../utils/setarCargo";

export const setarcargo: Command = {
  data: new SlashCommandBuilder()
    .setName("setar-cargo")
    .setDescription("Gerencia cargos de <:xxx:1514705761413107732> membros via bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Adiciona um cargo a um membro")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro que recebera o cargo").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a adicionar").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove um cargo de um membro")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro que perdera o cargo").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a remover").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("protecao")
        .setDescription("Ativa ou desativa a protecao contra cargos manuais")
        .addBooleanOption((opt) =>
          opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const sub = interaction.options.getSubcommand();

    // ── PROTECAO ──────────────────────────────────────────────────────────────
    if (sub === "protecao") {
      const adminError = await checkAdministrator(interaction);
      if (adminError) {
        await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
        return;
      }

      const ativar = interaction.options.getBoolean("ativar", true);
      const current = isSetarCargoProtectionEnabled(guild.id);

      if (ativar === current) {
        await interaction.reply(
          containerReplyOrganized(
            ["# **SETAR CARGO**", `${E} A protecao ja esta **${current ? "ativada" : "desativada"}**.`],
            { ephemeral: true }
          )
        );
        return;
      }

      setSetarCargoProtection(guild.id, ativar);

      await interaction.reply(
        containerReplyOrganized([
          "# **SETAR CARGO**",
          [
            `${V} **Protecao:** ${ativar ? "Ativada" : "Desativada"}`,
            `${E} **Configurado por:** <@${interaction.user.id}>`,
            "",
            ativar
              ? `${E} Apenas o bot pode adicionar ou remover cargos.\n${E} Qualquer tentativa manual sera revertida automaticamente.`
              : `${E} Protecao desativada. <:xxx:1514705761413107732> Membros podem alterar cargos normalmente.`,
          ].join("\n"),
        ])
      );
      return;
    }

    // ── ADD / REMOVER ─────────────────────────────────────────────────────────
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.reply(
        containerReplyOrganized([`${E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true })
      );
      return;
    }

    const targetUser = interaction.options.getUser("membro", true);
    const role = interaction.options.getRole("cargo", true);
    const member = await fetchGuildMember(guild, targetUser.id);

    if (!member) {
      await interaction.reply(
        containerReplyOrganized([`${E} Este membro nao esta no servidor.`], { ephemeral: true })
      );
      return;
    }

    if (role.managed) {
      await interaction.reply(
        containerReplyOrganized([`${E} Nao e possivel gerenciar cargos de integracao.`], { ephemeral: true })
      );
      return;
    }

    // Verifica hierarquia do bot
    if (role.position >= botMember.roles.highest.position) {
      await interaction.reply(
        containerReplyOrganized(
          [`${E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`],
          { ephemeral: true }
        )
      );
      return;
    }

    if (sub === "add") {
      if (member.roles.cache.has(role.id)) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} <@${member.id}> ja possui o cargo <@&${role.id}>.`],
            { ephemeral: true }
          )
        );
        return;
      }

      await member.roles.add(role.id, `Setar cargo por ${interaction.user.tag}`);

      await interaction.reply(
        containerReplyOrganized([
          "# **SETAR CARGO**",
          [
            `${V} **Cargo adicionado**`,
            `${E} **Membro:** <@${member.id}>`,
            `${E} **Cargo:** <@&${role.id}>`,
            `${E} **Executor:** <@${interaction.user.id}>`,
            `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join("\n"),
        ])
      );

      await sendLog(guild, "cargo", [
        [
          `${V} **Cargo adicionado via comando**`,
          `${E} **Membro:** <@${member.id}>`,
          `${E} **Cargo:** <@&${role.id}>`,
          `${E} **Executor:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
      return;
    }

    if (sub === "remover") {
      if (!member.roles.cache.has(role.id)) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} <@${member.id}> nao possui o cargo <@&${role.id}>.`],
            { ephemeral: true }
          )
        );
        return;
      }

      await member.roles.remove(role.id, `Remover cargo por ${interaction.user.tag}`);

      await interaction.reply(
        containerReplyOrganized([
          "# **SETAR CARGO**",
          [
            `${V} **Cargo removido**`,
            `${E} **Membro:** <@${member.id}>`,
            `${E} **Cargo:** <@&${role.id}>`,
            `${E} **Executor:** <@${interaction.user.id}>`,
            `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join("\n"),
        ])
      );

      await sendLog(guild, "cargo", [
        [
          `${V} **Cargo removido via comando**`,
          `${E} **Membro:** <@${member.id}>`,
          `${E} **Cargo:** <@&${role.id}>`,
          `${E} **Executor:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
    }
  },
};
