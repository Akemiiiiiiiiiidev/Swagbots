"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklist = void 0;
const discord_js_1 = require("discord.js");
const blacklist_1 = require("../utils/blacklist");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
exports.blacklist = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("blacklist")
        .setDescription("Gerencia a blacklist do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub.setName("adicionar").setDescription("Adiciona um usuario a blacklist e bane")
        .addUserOption((o) => o.setName("membro").setDescription("Usuario para adicionar").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario").setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo da blacklist").setRequired(false)))
        .addSubcommand((sub) => sub.setName("remover").setDescription("Remove um usuario da blacklist")
        .addUserOption((o) => o.setName("membro").setDescription("Usuario para remover").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario").setRequired(false)))
        .addSubcommand((sub) => sub.setName("lista").setDescription("Lista usuarios na blacklist")),
    async execute(interaction) {
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
            return;
        }
        const guild = interaction.guild;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "lista") {
            const users = (0, blacklist_1.getBlacklistUsers)(guild.id);
            if (users.length === 0) {
                await interaction.reply((0, container_1.containerReplyOrganized)(["# **BLACKLIST**", `${container_1.E} Nenhum usuario na blacklist.`]));
                return;
            }
            const list = users
                .map((entry, index) => [
                `${container_1.E} **${index + 1}.** <@${entry.userId}>`,
                `${container_1.E} **Motivo:** ${entry.reason}`,
                `${container_1.E} **Adicionado por:** <@${entry.addedBy}>`,
                `${container_1.E} **Data:** <t:${Math.floor(entry.addedAt / 1000)}:F>`,
            ].join("\n"))
                .join("\n\n");
            await interaction.reply((0, container_1.containerReplyOrganized)(["# **BLACKLIST**", `${container_1.E} **Total:** ${users.length} usuario(s)`, list]));
            return;
        }
        const target = await (0, moderation_1.resolveModerationTarget)(interaction, false);
        if ("error" in target) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${target.error}`], { ephemeral: true }));
            return;
        }
        if (subcommand === "adicionar") {
            if ((0, blacklist_1.isBlacklisted)(guild.id, target.userId)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este usuario ja esta na blacklist.`], { ephemeral: true }));
                return;
            }
            const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
            (0, blacklist_1.addToBlacklist)(guild.id, target.userId, reason, interaction.user.id);
            await guild.members.ban(target.userId, { reason: `Blacklist: ${interaction.user.tag}: ${reason}` }).catch(() => null);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **BLACKLIST**",
                [
                    `${container_1.V} **Usuario adicionado**`,
                    `${container_1.E} **Usuario:** <@${target.userId}>`,
                    `${container_1.E} **ID:** ${target.userId}`,
                    `${container_1.E} **Motivo:** ${reason}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Somente administradores podem desbanir este usuario.`,
            ]));
            await (0, logs_1.sendLog)(guild, "ban", [
                [
                    `${container_1.V} **Blacklist - usuario adicionado**`,
                    `${container_1.E} **Usuario:** <@${target.userId}>`,
                    `${container_1.E} **ID:** ${target.userId}`,
                    `${container_1.E} **Motivo:** ${reason}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
            return;
        }
        if (subcommand === "remover") {
            if (!(0, blacklist_1.removeFromBlacklist)(guild.id, target.userId)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este usuario nao esta na blacklist.`], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **BLACKLIST**",
                [
                    `${container_1.V} **Usuario removido**`,
                    `${container_1.E} **Usuario:** <@${target.userId}>`,
                    `${container_1.E} **ID:** ${target.userId}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} O usuario pode ser desbanido normalmente.`,
            ]));
            await (0, logs_1.sendLog)(guild, "ban", [
                [
                    `${container_1.V} **Blacklist - usuario removido**`,
                    `${container_1.E} **Usuario:** <@${target.userId}>`,
                    `${container_1.E} **ID:** ${target.userId}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
        }
    },
};
//# sourceMappingURL=blacklist.js.map