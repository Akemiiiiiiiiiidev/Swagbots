import {
  ChannelType,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../types";
import { containerEdit, containerReply } from "../utils/container";
import { sendLog } from "../utils/logs";

async function deleteAllChannels(guild: Guild, reason: string) {
  let deleted = 0;
  let failed = 0;

  await guild.channels.fetch();

  for (let pass = 0; pass < 3; pass++) {
    const channels = [...guild.channels.cache.values()].filter(
      (channel) => channel.type !== ChannelType.GuildCategory
    );

    if (channels.length === 0) break;

    for (const channel of channels) {
      try {
        await channel.delete(reason);
        deleted++;
      } catch {
        failed++;
      }
    }

    await guild.channels.fetch();
  }

  const categories = [...guild.channels.cache.values()]
    .filter((channel) => channel.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  for (const category of categories) {
    try {
      await category.delete(reason);
      deleted++;
    } catch {
      failed++;
    }
  }

  return { deleted, failed };
}

export const deletartudo: Command = {
  defer: true,

  data: new SlashCommandBuilder()
    .setName("deletartudo")
    .setDescription("Deleta todos os canais e cargos do servidor"),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply(
          containerReply("Este comando só pode ser usado em um servidor.", {
            ephemeral: true,
          })
        );
      }
      return;
    }

    let executorMember: GuildMember;

    try {
      executorMember = await guild.members.fetch(interaction.user.id);
    } catch {
      await interaction.editReply(
        containerEdit("Não foi possível verificar suas permissões.")
      );
      return;
    }

    const botMember = guild.members.me;

    if (
      !executorMember.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !executorMember.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      await interaction.editReply(
        containerEdit(
          "Você precisa das permissões Gerenciar canais e Gerenciar cargos."
        )
      );
      return;
    }

    if (
      !botMember?.permissions.has(PermissionFlagsBits.ManageChannels) ||
      !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      await interaction.editReply(
        containerEdit(
          "Eu preciso das permissões Gerenciar canais e Gerenciar cargos."
        )
      );
      return;
    }

    try {
      const reason = `${interaction.user.tag}: limpeza total do servidor`;
      const isOwner = executorMember.id === guild.ownerId;

      const channels = await deleteAllChannels(guild, reason);

      await guild.roles.fetch();

      let rolesDeleted = 0;
      let rolesSkipped = 0;

      const roles = [...guild.roles.cache.values()]
        .filter((role) => role.id !== guild.id)
        .sort((a, b) => a.position - b.position);

      for (const role of roles) {
        if (role.managed) {
          rolesSkipped++;
          continue;
        }

        if (role.position >= botMember.roles.highest.position) {
          rolesSkipped++;
          continue;
        }

        if (
          !isOwner &&
          role.position >= executorMember.roles.highest.position
        ) {
          rolesSkipped++;
          continue;
        }

        try {
          await role.delete(reason);
          rolesDeleted++;
        } catch {
          rolesSkipped++;
        }
      }

      await interaction.editReply(
        containerEdit(
          [
            "**Limpeza concluída**",
            `**Canais deletados:** ${channels.deleted}`,
            `**Canais com falha:** ${channels.failed}`,
            `**Cargos deletados:** ${rolesDeleted}`,
            `**Cargos ignorados:** ${rolesSkipped}`,
            `**Moderador:** ${interaction.user.tag}`,
          ].join("\n")
        )
      );

      await sendLog(guild, "call", [
        [
          "**Limpeza de canais**",
          `**Canais deletados:** ${channels.deleted}`,
          `**Canais com falha:** ${channels.failed}`,
          `**Moderador:** <@${interaction.user.id}>`,
          `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);

      await sendLog(guild, "cargo", [
        [
          "**Limpeza de cargos**",
          `**Cargos deletados:** ${rolesDeleted}`,
          `**Cargos ignorados:** ${rolesSkipped}`,
          `**Moderador:** <@${interaction.user.id}>`,
          `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
    } catch (error) {
      console.error("Erro em /deletartudo:", error);

      try {
        await interaction.editReply(
          containerEdit(
            "Ocorreu um erro durante a limpeza. Verifique se o bot tem permissões suficientes."
          )
        );
      } catch {
        // Interação já expirou ou foi respondida
      }
    }
  },
};
