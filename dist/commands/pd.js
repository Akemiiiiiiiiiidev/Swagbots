"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pd = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const pd_1 = require("../utils/pd");
const pdInteractions_1 = require("../events/pdInteractions");
exports.pd = {
    noAutoDelete: true,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("pd")
        .setDescription("Sistema de Primeira Dama")
        .addSubcommand((sub) => sub
        .setName("config")
        .setDescription("Painel de configuracao do sistema PD (apenas admins)"))
        .addSubcommand((sub) => sub
        .setName("painel")
        .setDescription("Abre o painel de Primeira Dama")),
    async execute(interaction) {
        (0, pd_1.initPd)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
        const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
        // ── /pd config — apenas admins ────────────────────────────────────────────
        if (sub === "config") {
            if (!isAdmin) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Apenas administradores podem usar este painel.`], { ephemeral: true }));
                return;
            }
            await interaction.reply({
                components: [(0, pdInteractions_1.buildPdAdminPanel)(guild.id)],
                flags: discord_js_1.MessageFlags.IsComponentsV2,
            });
            // Deleta o painel após 5 minutos de inatividade
            const reply = await interaction.fetchReply();
            setTimeout(() => reply.delete().catch(() => null), 5 * 60 * 1000);
            return;
        }
        // ── /pd painel — cargos com acesso ou admins ──────────────────────────────
        if (sub === "painel") {
            const memberRoleIds = executorMember?.roles.cache.map((r) => r.id) ?? [];
            const hasAccess = isAdmin || (0, pd_1.memberHasPdAccess)(guild.id, memberRoleIds);
            if (!hasAccess) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para usar este painel.`], { ephemeral: true }));
                return;
            }
            await interaction.reply({
                components: [(0, pdInteractions_1.buildPdUserPanel)(guild.id, interaction.user.id)],
                flags: discord_js_1.MessageFlags.IsComponentsV2,
            });
            // Deleta o painel após 5 minutos de inatividade
            const reply = await interaction.fetchReply();
            setTimeout(() => reply.delete().catch(() => null), 5 * 60 * 1000);
            return;
        }
    },
};
//# sourceMappingURL=pd.js.map