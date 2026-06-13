import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types";
import { containerReplyOrganized, E, V } from "../utils/container";
import { getAllColeiras, getColeira, hasColeira, listColeirasByExecutor, removeColeira, removeColeiraByExecutor, setColeira } from "../utils/coleira";
import { fetchGuildMember } from "../utils/moderation";

export const coleira: Command = {
  data: new SlashCommandBuilder()
    .setName("coleira")
    .setDescription("Sistema de coleira de voz")
    .addSubcommand((sub) =>
      sub.setName("ativar").setDescription("Ativa a coleira em um usuario — voce sera movido para a call dele")
        .addUserOption((opt) => opt.setName("usuario").setDescription("Usuario alvo da coleira").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("remover").setDescription("Remove a coleira de um usuario especifico")
        .addUserOption((opt) => opt.setName("usuario").setDescription("Usuario para remover a coleira").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("remover-todas").setDescription("Remove todas as coleiras que voce ativou"))
    .addSubcommand((sub) => sub.setName("listar").setDescription("Lista todos os usuarios <:xxx:1514705761413107732> com coleira ativa")),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(containerReplyOrganized([`${E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
      return;
    }
    const sub = interaction.options.getSubcommand();

    // ── ATIVAR ────────────────────────────────────────────────────────────────
    if (sub === "ativar") {
      const targetUser = interaction.options.getUser("usuario", true);
      if (targetUser.id === interaction.user.id) {
        await interaction.reply(containerReplyOrganized([`${E} Voce nao pode colocar coleira em si mesmo.`], { ephemeral: true }));
        return;
      }
      if (targetUser.bot) {
        await interaction.reply(containerReplyOrganized([`${E} Nao e possivel colocar coleira em bots.`], { ephemeral: true }));
        return;
      }
      const target = await fetchGuildMember(guild, targetUser.id);
      if (!target) {
        await interaction.reply(containerReplyOrganized([`${E} Este usuario <:xxx:1514705761413107732> nao esta no servidor.`], { ephemeral: true }));
        return;
      }
      if (hasColeira(guild.id, target.id)) {
        const currentExecutorId = getColeira(guild.id, target.id)!;
        const isMine = currentExecutorId === interaction.user.id;
        await interaction.reply(
          containerReplyOrganized(
            [
              `${E} <@${target.id}> ja possui coleira ativa${isMine ? " por voce" : ` por <@${currentExecutorId}>`}.`,
              `${E} Use \`/coleira remover\` para remover primeiro.`,
            ],
            { ephemeral: true }
          )
        );
        return;
      }
      setColeira(guild.id, target.id, interaction.user.id);
      const executor = await fetchGuildMember(guild, interaction.user.id);
      const targetVoice = target.voice.channel;
      const executorVoice = executor?.voice.channel;
      let movedNow = false;
      if (targetVoice && executorVoice) {
        try {
          await executor!.voice.setChannel(targetVoice, "Coleira ativada");
          movedNow = true;
        } catch { /* sem permissao */ }
      }
      await interaction.reply(
        containerReplyOrganized([
          "# **COLEIRA**",
          `${V} **Status:** Ativada`,
          `<:xxx:1514705761413107732> **Alvo:** <@${target.id}>\n<:emoji_35:1514704874762272869> **Executor:** <@${interaction.user.id}>`,
          movedNow
            ? `${V} **Movido agora:** Sim — para **${targetVoice!.name}**`
            : targetVoice
            ? `${E} **Aviso:** Voce nao esta em call — entre em uma call para ser movido.`
            : `${E} **Aviso:** O alvo nao esta em call no momento.`,
          `${E} Sempre que <@${target.id}> mudar de canal de voz, voce sera movido junto automaticamente.`,
        ])
      );
      return;
    }

    // ── REMOVER ──────────────────────────────────────────────────────────────
    if (sub === "remover") {
      const targetUser = interaction.options.getUser("usuario", true);
      if (!hasColeira(guild.id, targetUser.id)) {
        await interaction.reply(containerReplyOrganized([`${E} <@${targetUser.id}> nao possui coleira ativa.`], { ephemeral: true }));
        return;
      }
      const currentExecutorId = getColeira(guild.id, targetUser.id)!;
      if (currentExecutorId !== interaction.user.id) {
        await interaction.reply(
          containerReplyOrganized([`${E} Essa coleira foi ativada por <@${currentExecutorId}>. Somente quem ativou pode remover.`], { ephemeral: true })
        );
        return;
      }
      removeColeira(guild.id, targetUser.id);
      await interaction.reply(
        containerReplyOrganized([
          "# **COLEIRA**",
          [
            `${V} **Status:** Removida`,
            `${E} **Alvo:** <@${targetUser.id}>`,
            `${E} **Removido por:** <@${interaction.user.id}>`,
          ].join("\n"),
        ])
      );
      return;
    }

    // ── REMOVER TODAS ─────────────────────────────────────────────────────────
    if (sub === "remover-todas") {
      const list = listColeirasByExecutor(guild.id, interaction.user.id);
      if (list.length === 0) {
        await interaction.reply(containerReplyOrganized([`${E} Voce nao possui nenhuma coleira ativa.`], { ephemeral: true }));
        return;
      }
      removeColeiraByExecutor(guild.id, interaction.user.id);
      await interaction.reply(
        containerReplyOrganized([
          "# **COLEIRA**",
          [
            `${V} **Status:** Todas removidas`,
            `${E} **Total removidas:** ${list.length}`,
            `${E} **usuarios <:xxx:1514705761413107732>:** ${list.map((id) => `<@${id}>`).join(", ")}`,
          ].join("\n"),
        ])
      );
      return;
    }

    // ── LISTAR ────────────────────────────────────────────────────────────────
    if (sub === "listar") {
      const all = getAllColeiras(guild.id);
      if (all.length === 0) {
        await interaction.reply(containerReplyOrganized([`${E} Nenhuma coleira ativa neste servidor.`], { ephemeral: true }));
        return;
      }
      const lines = all
        .map(({ targetId, executorId }) => `${E} <@${targetId}> → seguido por <@${executorId}>`)
        .join("\n");
      await interaction.reply(
        containerReplyOrganized([
          "# **COLEIRA**",
          [`${V} **Total ativo:** ${all.length}`, "", lines].join("\n"),
        ])
      );
    }
  },
};
