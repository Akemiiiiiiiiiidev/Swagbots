"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mute = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
exports.mute = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("mute").setDescription("Silencia um usuário temporariamente")
        .addUserOption((o) => o.setName("membro").setDescription("Usuário para silenciar (menção)").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario para silenciar").setRequired(false))
        .addIntegerOption((o) => o.setName("duracao").setDescription("Duração em minutos").setMinValue(1).setMaxValue(40320).setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo do silenciamento").setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, moderation_1.ModerationPermissions.mute);
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
        const durationMinutes = interaction.options.getInteger("duracao") ?? 60;
        const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
        await target.member.timeout(durationMinutes * 60 * 1000, `${interaction.user.tag}: ${reason}`);
        await interaction.reply((0, container_1.containerReply)([`${container_1.V} **Silenciamento aplicado**`, `${container_1.E} **Usuario:** ${target.tag}`, `${container_1.E} **ID:** ${target.userId}`, `${container_1.E} **Duração:** ${(0, moderation_1.formatDuration)(durationMinutes)}`, `${container_1.E} **Motivo:** ${reason}`, `${container_1.E} **Moderador:** ${interaction.user.tag}`].join("\n")));
        await (0, logs_1.sendLog)(interaction.guild, "mute", [
            [`${container_1.V} **Silenciamento aplicado**`, `${container_1.E} **Usuario:** <@${target.userId}>`, `${container_1.E} **ID:** ${target.userId}`, `${container_1.E} **Duracao:** ${(0, moderation_1.formatDuration)(durationMinutes)}`, `${container_1.E} **Motivo:** ${reason}`, `${container_1.E} **Moderador:** <@${interaction.user.id}>`, `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
        ]);
    },
};
//# sourceMappingURL=mute.js.map