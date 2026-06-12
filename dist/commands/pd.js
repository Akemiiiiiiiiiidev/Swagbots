"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pd = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const pd_1 = require("../utils/pd");
const pdInteractions_1 = require("../events/pdInteractions");
exports.pd = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("pd")
        .setDescription("Abre o painel de gerenciamento da Primeira Dama"),
    async execute(interaction) {
        (0, pd_1.initPd)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
        const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
        const memberRoleIds = executorMember?.roles.cache.map((r) => r.id) ?? [];
        const hasAccess = isAdmin || (0, pd_1.memberHasPdAccess)(guild.id, memberRoleIds);
        if (!hasAccess) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para usar este painel.`], { ephemeral: true }));
            return;
        }
        // Admins veem painel completo (4 botões), demais veem só setar/remover (2 botões)
        const panel = isAdmin
            ? (0, pdInteractions_1.buildPdAdminPanel)(guild.id)
            : (0, pdInteractions_1.buildPdUserPanel)(guild.id, interaction.user.id);
        await interaction.reply({
            components: [panel],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
    },
};
//# sourceMappingURL=pd.js.map