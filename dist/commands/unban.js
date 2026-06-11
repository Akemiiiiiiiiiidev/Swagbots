"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unban = void 0;
const discord_js_1 = require("discord.js");
const blacklist_1 = require("../utils/blacklist");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
exports.unban = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("unban").setDescription("Desbane um usuario do servidor")
        .addUserOption((o) => o.setName("membro").setDescription("Usuario para desbanir").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario para desbanir").setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, moderation_1.ModerationPermissions.ban);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${permissionError}`], { ephemeral: true }));
            return;
        }
        const guild = interaction.guild;
        const target = await (0, moderation_1.resolveModerationTarget)(interaction, false);
        if ("error" in target) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${target.error}`], { ephemeral: true }));
            return;
        }
        const blacklisted = (0, blacklist_1.isBlacklisted)(guild.id, target.userId);
        if (blacklisted) {
            const executor = await (0, moderation_1.fetchExecutorMember)(interaction);
            if (!executor || !(0, moderation_1.isAdministrator)(executor)) {
                await interaction.reply((0, container_1.containerReplyOrganized)(["# **DESBANIMENTO NEGADO**", [`${container_1.E} **Usuario na blacklist**`, `${container_1.E} **Usuario:** <@${target.userId}>`, `${container_1.E} Somente administradores podem desbanir este usuario.`].join("\n")], { ephemeral: true }));
                return;
            }
            (0, blacklist_1.removeFromBlacklist)(guild.id, target.userId);
        }
        await guild.members.unban(target.userId, `${interaction.user.tag}: desbanimento`);
        await interaction.reply((0, container_1.containerReplyOrganized)([
            "# **DESBANIMENTO**",
            [
                `${container_1.V} **Usuario desbanido**`,
                `${container_1.E} **Usuario:** <@${target.userId}>`,
                `${container_1.E} **ID:** ${target.userId}`,
                `${container_1.E} **Moderador:** <@${interaction.user.id}>`,
                blacklisted ? `${container_1.E} **Blacklist:** removido automaticamente` : `${container_1.E} **Blacklist:** nao aplicavel`,
            ].join("\n"),
        ]));
        await (0, logs_1.sendLog)(guild, "ban", [
            [
                `${container_1.V} **Desbanimento**`,
                `${container_1.E} **Usuario:** <@${target.userId}>`,
                `${container_1.E} **ID:** ${target.userId}`,
                `${container_1.E} **Moderador:** <@${interaction.user.id}>`,
                blacklisted ? `${container_1.E} **Blacklist:** removido automaticamente` : `${container_1.E} **Blacklist:** nao aplicavel`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
    },
};
//# sourceMappingURL=unban.js.map