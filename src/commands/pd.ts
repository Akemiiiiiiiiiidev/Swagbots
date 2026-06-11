import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator, fetchGuildMember } from "../utils/moderation";
import { sendLog } from "../utils/logs";
import {
  addPdAllowedUser,
  getPdAllowedUsers,
  getPdRoleId,
  initPd,
  isPdAllowedUser,
  removePdAllowedUser,
  setPdRole,
} from "../utils/pd";

export const pd: Command = {
  data: new SlashCommandBuilder()
    .setName("pd")
    .setDescription("Sistema de Primeira Dama")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Configura o cargo e os usuarios com acesso ao /pd")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo que sera setado como Primeira Dama").setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName("usuario1").setDescription("Usuario que podera usar o /pd").setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName("usuario2").setDescription("Usuario que podera usar o /pd").setRequired(false)
        )
        .addUserOption((opt) =>
          opt.setName("usuario3").setDescription("Usuario que podera usar o /pd").setRequired(false)
        )
        .addUserOption((opt) =>
          opt.setName("usuario4").setDescription("Usuario que podera usar o /pd").setRequired(false)
        )
        .addUserOption((opt) =>
          opt.setName("usuario5").setDescription("Usuario que podera usar o /pd").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("setar")
        .setDescription("Seta o cargo de Primeira Dama em um membro")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro que recebera o cargo").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove o cargo de Primeira Dama de um membro")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro que perdera o cargo").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("ver").setDescription("Mostra a configuracao atual do sistema PD")
    ),

  async execute(interaction) {
    initPd();

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(
        containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true })
      );
      return;
    }

    const sub = interaction.options.getSubcommand();

    // ── SETUP ─────────────────────────────────────────────────────────────────
    if (sub === "setup") {
      const adminError = await checkAdministrator(interaction);
      if (adminError) {
        await interaction.reply(containerReplyOrganized([`${E} ${adminError}`], { ephemeral: true }));
        return;
      }

      const role = interaction.options.getRole("cargo", true);

      if (role.managed) {
        await interaction.reply(
          containerReplyOrganized([`${E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true })
        );
        return;
      }

      const botMember = guild.members.me;
      if (role.position >= (botMember?.roles.highest.position ?? 0)) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`],
            { ephemeral: true }
          )
        );
        return;
      }

      setPdRole(guild.id, role.id);

      // Coleta usuarios das opcoes
      const userOptions = ["usuario1", "usuario2", "usuario3", "usuario4", "usuario5"];
      const addedUsers: string[] = [];

      for (const optName of userOptions) {
        const user = interaction.options.getUser(optName);
        if (!user || user.bot) continue;
        addPdAllowedUser(guild.id, user.id);
        addedUsers.push(user.id);
      }

      const allAllowed = getPdAllowedUsers(guild.id);

      await interaction.reply(
        containerReplyOrganized([
          "# **PRIMEIRA DAMA**",
          [
            `${V} **Configuracao salva**`,
            `${E} **Cargo:** <@&${role.id}>`,
            `${E} **Administrador:** <@${interaction.user.id}>`,
          ].join("\n"),
          [
            `${E} **Usuarios com acesso ao /pd (${allAllowed.length}):**`,
            allAllowed.length > 0
              ? allAllowed.map((id) => `${E} <@${id}>`).join("\n")
              : `${E} Nenhum usuario configurado.`,
          ].join("\n"),
        ])
      );

      await sendLog(guild, "cargo", [
        [
          `${V} **PD configurado**`,
          `${E} **Cargo:** <@&${role.id}>`,
          `${E} **Usuarios adicionados:** ${addedUsers.map((id) => `<@${id}>`).join(", ") || "nenhum"}`,
          `${E} **Administrador:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
      return;
    }

    // ── VER ───────────────────────────────────────────────────────────────────
    if (sub === "ver") {
      const roleId = getPdRoleId(guild.id);
      const allowed = getPdAllowedUsers(guild.id);

      if (!roleId) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} Nenhuma configuracao de PD encontrada.`, `${E} Use \`/pd setup\` para configurar.`],
            { ephemeral: true }
          )
        );
        return;
      }

      await interaction.reply(
        containerReplyOrganized([
          "# **PRIMEIRA DAMA**",
          [
            `${V} **Configuracao atual**`,
            `${E} **Cargo:** <@&${roleId}>`,
          ].join("\n"),
          [
            `${E} **Usuarios com acesso (${allowed.length}):**`,
            allowed.length > 0
              ? allowed.map((id) => `${E} <@${id}>`).join("\n")
              : `${E} Nenhum usuario configurado.`,
          ].join("\n"),
        ])
      );
      return;
    }

    // ── SETAR / REMOVER ───────────────────────────────────────────────────────
    if (sub === "setar" || sub === "remover") {
      // Verifica se o executor tem permissao de PD ou e administrador
      const executorMember = await fetchGuildMember(guild, interaction.user.id);
      const isAdmin = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
      const hasAccess = isAdmin || isPdAllowedUser(guild.id, interaction.user.id);

      if (!hasAccess) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} Voce nao tem permissao para usar este comando.`],
            { ephemeral: true }
          )
        );
        return;
      }

      const roleId = getPdRoleId(guild.id);
      if (!roleId) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} O cargo de PD ainda nao foi configurado.`, `${E} Um administrador precisa usar \`/pd setup\` primeiro.`],
            { ephemeral: true }
          )
        );
        return;
      }

      const targetUser = interaction.options.getUser("membro", true);
      if (targetUser.bot) {
        await interaction.reply(
          containerReplyOrganized([`${E} Nao e possivel usar este comando em bots.`], { ephemeral: true })
        );
        return;
      }

      const member = await fetchGuildMember(guild, targetUser.id);
      if (!member) {
        await interaction.reply(
          containerReplyOrganized([`${E} Este membro nao esta no servidor.`], { ephemeral: true })
        );
        return;
      }

      const botMember = guild.members.me;
      if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply(
          containerReplyOrganized([`${E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true })
        );
        return;
      }

      const role = guild.roles.cache.get(roleId);
      if (!role) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} O cargo configurado nao existe mais. Use \`/pd setup\` para reconfigurar.`],
            { ephemeral: true }
          )
        );
        return;
      }

      if (role.position >= botMember.roles.highest.position) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`],
            { ephemeral: true }
          )
        );
        return;
      }

      if (sub === "setar") {
        if (member.roles.cache.has(roleId)) {
          await interaction.reply(
            containerReplyOrganized(
              [`${E} <@${member.id}> ja possui o cargo <@&${roleId}>.`],
              { ephemeral: true }
            )
          );
          return;
        }

        await member.roles.add(roleId, `PD setado por ${interaction.user.tag}`);

        await interaction.reply(
          containerReplyOrganized([
            "# **PRIMEIRA DAMA**",
            [
              `${V} **Cargo setado**`,
              `${E} **Membro:** <@${member.id}>`,
              `${E} **Cargo:** <@&${roleId}>`,
              `${E} **Executor:** <@${interaction.user.id}>`,
              `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
          ])
        );

        await sendLog(guild, "cargo", [
          [
            `${V} **PD setado**`,
            `${E} **Membro:** <@${member.id}>`,
            `${E} **Cargo:** <@&${roleId}>`,
            `${E} **Executor:** <@${interaction.user.id}>`,
            `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join("\n"),
        ]);
        return;
      }

      if (sub === "remover") {
        if (!member.roles.cache.has(roleId)) {
          await interaction.reply(
            containerReplyOrganized(
              [`${E} <@${member.id}> nao possui o cargo <@&${roleId}>.`],
              { ephemeral: true }
            )
          );
          return;
        }

        await member.roles.remove(roleId, `PD removido por ${interaction.user.tag}`);

        await interaction.reply(
          containerReplyOrganized([
            "# **PRIMEIRA DAMA**",
            [
              `${V} **Cargo removido**`,
              `${E} **Membro:** <@${member.id}>`,
              `${E} **Cargo:** <@&${roleId}>`,
              `${E} **Executor:** <@${interaction.user.id}>`,
              `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
          ])
        );

        await sendLog(guild, "cargo", [
          [
            `${V} **PD removido**`,
            `${E} **Membro:** <@${member.id}>`,
            `${E} **Cargo:** <@&${roleId}>`,
            `${E} **Executor:** <@${interaction.user.id}>`,
            `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join("\n"),
        ]);
      }
    }
  },
};
