"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coleira = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const coleira_1 = require("../utils/coleira");
const moderation_1 = require("../utils/moderation");
exports.coleira = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("coleira")
        .setDescription("Sistema de coleira de voz")
        .addSubcommand((sub) => sub.setName("ativar").setDescription("Ativa a coleira em um usuario — voce sera movido para a call dele")
        .addUserOption((opt) => opt.setName("usuario").setDescription("Usuario alvo da coleira").setRequired(true)))
        .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a coleira de um usuario especifico")
        .addUserOption((opt) => opt.setName("usuario").setDescription("Usuario para remover a coleira").setRequired(true)))
        .addSubcommand((sub) => sub.setName("remover-todas").setDescription("Remove todas as coleiras que voce ativou"))
        .addSubcommand((sub) => sub.setName("listar").setDescription("Lista todos os usuarios com coleira ativa")),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        // ── ATIVAR ────────────────────────────────────────────────────────────────
        if (sub === "ativar") {
            const targetUser = interaction.options.getUser("usuario", true);
            if (targetUser.id === interaction.user.id) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao pode colocar coleira em si mesmo.`], { ephemeral: true }));
                return;
            }
            if (targetUser.bot) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel colocar coleira em bots.`], { ephemeral: true }));
                return;
            }
            const target = await (0, moderation_1.fetchGuildMember)(guild, targetUser.id);
            if (!target) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este usuario nao esta no servidor.`], { ephemeral: true }));
                return;
            }
            if ((0, coleira_1.hasColeira)(guild.id, target.id)) {
                const currentExecutorId = (0, coleira_1.getColeira)(guild.id, target.id);
                const isMine = currentExecutorId === interaction.user.id;
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    `${container_1.E} <@${target.id}> ja possui coleira ativa${isMine ? " por voce" : ` por <@${currentExecutorId}>`}.`,
                    `${container_1.E} Use \`/coleira remover\` para remover primeiro.`,
                ], { ephemeral: true }));
                return;
            }
            (0, coleira_1.setColeira)(guild.id, target.id, interaction.user.id);
            const executor = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
            const targetVoice = target.voice.channel;
            const executorVoice = executor?.voice.channel;
            let movedNow = false;
            if (targetVoice && executorVoice) {
                try {
                    await executor.voice.setChannel(targetVoice, "Coleira ativada");
                    movedNow = true;
                }
                catch { /* sem permissao */ }
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **COLEIRA**",
                `${container_1.V} **Status:** Ativada`,
                `<:xxx:1514705761413107732> **Alvo:** <@${target.id}>\n<:emoji_35:1514704874762272869> **Executor:** <@${interaction.user.id}>`,
                movedNow
                    ? `${container_1.V} **Movido agora:** Sim — para **${targetVoice.name}**`
                    : targetVoice
                        ? `${container_1.E} **Aviso:** Voce nao esta em call — entre em uma call para ser movido.`
                        : `${container_1.E} **Aviso:** O alvo nao esta em call no momento.`,
                `${container_1.E} Sempre que <@${target.id}> mudar de canal de voz, voce sera movido junto automaticamente.`,
            ]));
            return;
        }
        // ── REMOVER ──────────────────────────────────────────────────────────────
        if (sub === "remover") {
            const targetUser = interaction.options.getUser("usuario", true);
            if (!(0, coleira_1.hasColeira)(guild.id, targetUser.id)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${targetUser.id}> nao possui coleira ativa.`], { ephemeral: true }));
                return;
            }
            const currentExecutorId = (0, coleira_1.getColeira)(guild.id, targetUser.id);
            if (currentExecutorId !== interaction.user.id) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Essa coleira foi ativada por <@${currentExecutorId}>. Somente quem ativou pode remover.`], { ephemeral: true }));
                return;
            }
            (0, coleira_1.removeColeira)(guild.id, targetUser.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **COLEIRA**",
                [
                    `${container_1.V} **Status:** Removida`,
                    `${container_1.E} **Alvo:** <@${targetUser.id}>`,
                    `${container_1.E} **Removido por:** <@${interaction.user.id}>`,
                ].join("\n"),
            ]));
            return;
        }
        // ── REMOVER TODAS ─────────────────────────────────────────────────────────
        if (sub === "remover-todas") {
            const list = (0, coleira_1.listColeirasByExecutor)(guild.id, interaction.user.id);
            if (list.length === 0) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao possui nenhuma coleira ativa.`], { ephemeral: true }));
                return;
            }
            (0, coleira_1.removeColeiraByExecutor)(guild.id, interaction.user.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **COLEIRA**",
                [
                    `${container_1.V} **Status:** Todas removidas`,
                    `${container_1.E} **Total removidas:** ${list.length}`,
                    `${container_1.E} **Usuarios:** ${list.map((id) => `<@${id}>`).join(", ")}`,
                ].join("\n"),
            ]));
            return;
        }
        // ── LISTAR ────────────────────────────────────────────────────────────────
        if (sub === "listar") {
            const all = (0, coleira_1.getAllColeiras)(guild.id);
            if (all.length === 0) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nenhuma coleira ativa neste servidor.`], { ephemeral: true }));
                return;
            }
            const lines = all
                .map(({ targetId, executorId }) => `${container_1.E} <@${targetId}> → seguido por <@${executorId}>`)
                .join("\n");
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **COLEIRA**",
                [`${container_1.V} **Total ativo:** ${all.length}`, "", lines].join("\n"),
            ]));
        }
    },
};
//# sourceMappingURL=coleira.js.map