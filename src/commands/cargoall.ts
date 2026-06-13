import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  GuildMember,
} from "discord.js";
import type { Command } from "../types";
import { containerEditOrganized, containerReplyOrganized, E, V } from "../utils/container";
import { checkAdministrator } from "../utils/moderation";
import { sendLog } from "../utils/logs";

// Aguarda ms entre batches para evitar rate limit
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const cargoall: Command = {
  data: new SlashCommandBuilder()
    .setName("cargo-all")
    .setDescription("Adiciona ou remove um cargo de todos os <:xxx:1514705761413107732> membros do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Adiciona um cargo a todos os <:xxx:1514705761413107732> membros")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a adicionar").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove um cargo de todos os <:xxx:1514705761413107732> membros")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a remover").setRequired(true)
        )
    ),

  defer: true,

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.editReply(
        containerEditOrganized([`${E} Este comando so pode ser usado em um servidor.`])
      );
      return;
    }

    const adminError = await checkAdministrator(interaction);
    if (adminError) {
      await interaction.editReply(containerEditOrganized([`${E} ${adminError}`]));
      return;
    }

    const botMember = guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply(
        containerEditOrganized([`${E} Nao tenho permissao para gerenciar cargos.`])
      );
      return;
    }

    const role = interaction.options.getRole("cargo", true);
    const sub = interaction.options.getSubcommand();

    if (role.managed) {
      await interaction.editReply(
        containerEditOrganized([`${E} Nao e possivel gerenciar cargos de integracao.`])
      );
      return;
    }

    if (role.position >= botMember.roles.highest.position) {
      await interaction.editReply(
        containerEditOrganized([
          `${E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`,
        ])
      );
      return;
    }

    // Busca todos os membros
    await guild.members.fetch();
    const allMembers = guild.members.cache.filter((m: GuildMember) => !m.user.bot);
    const total = allMembers.size;

    await interaction.editReply(
      containerEditOrganized([
        `# **CARGO ALL**`,
        `${E} Processando **${total}** <:xxx:1514705761413107732> membros... aguarde.`,
      ])
    );

    let success = 0;
    let skipped = 0;
    let failed = 0;
    const BATCH = 10;
    const members = [...allMembers.values()];

    for (let i = 0; i < members.length; i += BATCH) {
      const batch = members.slice(i, i + BATCH);

      await Promise.allSettled(
        batch.map(async (member: GuildMember) => {
          try {
            if (sub === "add") {
              if (member.roles.cache.has(role.id)) {
                skipped++;
                return;
              }
              await member.roles.add(role.id, `Cargo-all por ${interaction.user.tag}`);
            } else {
              if (!member.roles.cache.has(role.id)) {
                skipped++;
                return;
              }
              await member.roles.remove(role.id, `Cargo-all por ${interaction.user.tag}`);
            }
            success++;
          } catch {
            failed++;
          }
        })
      );

      // Pequena pausa a cada batch para respeitar rate limit
      if (i + BATCH < members.length) {
        await wait(1000);
      }
    }

    const action = sub === "add" ? "adicionado" : "removido";

    await interaction.editReply(
      containerEditOrganized([
        `# **CARGO ALL**`,
        [
          `${V} **Cargo ${action}:** <@&${role.id}>`,
          `${E} **Executor:** <@${interaction.user.id}>`,
          `${E} **Total de <:xxx:1514705761413107732> membros:** ${total}`,
          `${V} **Sucesso:** ${success}`,
          `${E} **Ja tinham/sem cargo:** ${skipped}`,
          failed > 0 ? `${E} **Falhas:** ${failed}` : "",
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ]
          .filter(Boolean)
          .join("\n"),
      ])
    );

    await sendLog(guild, "cargo", [
      [
        `${V} **Cargo-all executado**`,
        `${E} **Acao:** ${sub === "add" ? "Adicionar" : "Remover"} cargo de todos`,
        `${E} **Cargo:** <@&${role.id}>`,
        `${E} **Executor:** <@${interaction.user.id}>`,
        `${E} **Sucesso:** ${success} | **Pulados:** ${skipped} | **Falhas:** ${failed}`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  },
};
