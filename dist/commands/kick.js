"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kick = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
exports.kick = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("kick").setDescription("Expulsa um usuário do servidor")
        .addUserOption((o) => o.setName("membro").setDescription("Usuário para expulsar (menção)").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario para expulsar").setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo da expulsao").setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, moderation_1.ModerationPermissions.kick);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${permissionError}`, { ephemeral: true }));
            return;
        }
        const target = await (0, moderation_1.resolveModerationTarget)(interaction, true);
        if ("error" in target) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${target.error}`, { ephemeral: true }));
            return;
        }
        const hierarchyError = (0, moderation_1.checkModerationHierarchy)(interaction, target.member);
        if (hierarchyError) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${hierarchyError}`, { ephemeral: true }));
            return;
        }
        const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
        await target.member.kick(`${interaction.user.tag}: ${reason}`);
        await interaction.reply((0, container_1.containerReply)([`${container_1.V} **Expulsão aplicada**`, `${container_1.E} **Usuario:** ${target.tag}`, `${container_1.E} **ID:** ${target.userId}`, `${container_1.E} **Motivo:** ${reason}`, `${container_1.E} **Moderador:** ${interaction.user.tag}`].join("\n")));
        await (0, logs_1.sendLog)(interaction.guild, "ban", [
            [`${container_1.V} **Expulsao aplicada**`, `${container_1.E} **Usuario:** <@${target.userId}>`, `${container_1.E} **ID:** ${target.userId}`, `${container_1.E} **Motivo:** ${reason}`, `${container_1.E} **Moderador:** <@${interaction.user.id}>`, `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
        ]);
    },
};
//# sourceMappingURL=kick.js.map