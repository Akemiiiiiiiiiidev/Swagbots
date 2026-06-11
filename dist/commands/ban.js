"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ban = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const moderation_1 = require("../utils/moderation");
const antiban_1 = require("../utils/antiban");
async function sendBanDm(interaction, target, reason) {
    const guild = interaction.guild;
    const user = interaction.options.getUser("membro") ??
        (await interaction.client.users.fetch(target.userId).catch(() => null));
    if (!user)
        return false;
    try {
        await user.send((0, container_1.containerMessage)([
            [`${container_1.E} **Banimento**`, `${container_1.E} Você foi banido do servidor **${guild.name}**`].join("\n"),
            [
                `${container_1.E} **Servidor:** ${guild.name}`,
                `${container_1.E} **Motivo:** ${reason}`,
                `${container_1.E} **Moderador:** ${interaction.user.tag}`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]));
        return true;
    }
    catch {
        return false;
    }
}
exports.ban = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bane um usuário do servidor")
        .addUserOption((o) => o.setName("membro").setDescription("Usuário para banir (menção)").setRequired(false))
        .addStringOption((o) => o.setName("id").setDescription("ID do usuario para banir").setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo do banimento").setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, moderation_1.ModerationPermissions.ban);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${permissionError}`, { ephemeral: true }));
            return;
        }
        const target = await (0, moderation_1.resolveModerationTarget)(interaction, false);
        if ("error" in target) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${target.error}`, { ephemeral: true }));
            return;
        }
        if (target.userId === interaction.user.id) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} Você não pode banir a si mesmo.`, { ephemeral: true }));
            return;
        }
        if (target.member) {
            const hierarchyError = (0, moderation_1.checkModerationHierarchy)(interaction, target.member);
            if (hierarchyError) {
                await interaction.reply((0, container_1.containerReply)(`${container_1.E} ${hierarchyError}`, { ephemeral: true }));
                return;
            }
            // Verifica proteção antiban
            if ((0, antiban_1.isAntibanProtected)(target.member)) {
                const antibanRoleId = (0, antiban_1.getAntibanRoleId)(target.member.guild.id);
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    "# **ANTIBAN**",
                    [
                        `${container_1.E} **Banimento negado**`,
                        `${container_1.E} **Usuario:** <@${target.userId}>`,
                        antibanRoleId ? `${container_1.E} **Cargo protegido:** <@&${antibanRoleId}>` : "",
                        `${container_1.E} Este usuario possui o cargo antiban e nao pode ser banido.`,
                    ].filter(Boolean).join("\n"),
                ], { ephemeral: true }));
                return;
            }
        }
        const reason = interaction.options.getString("motivo") ?? "Sem motivo informado";
        const dmSent = await sendBanDm(interaction, target, reason);
        await interaction.guild.members.ban(target.userId, { reason: `${interaction.user.tag}: ${reason}` });
        await interaction.reply((0, container_1.containerReply)([
            `${container_1.V} **Banimento aplicado**`,
            `${container_1.E} **Usuario:** ${target.tag}`,
            `${container_1.E} **ID:** ${target.userId}`,
            `${container_1.E} **Motivo:** ${reason}`,
            `${container_1.E} **Moderador:** ${interaction.user.tag}`,
            `${container_1.E} **Aviso no privado:** ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
        ].join("\n")));
        await (0, logs_1.sendLog)(interaction.guild, "ban", [
            [
                `${container_1.V} **Banimento aplicado**`,
                `${container_1.E} **Usuario:** <@${target.userId}>`,
                `${container_1.E} **ID:** ${target.userId}`,
                `${container_1.E} **Motivo:** ${reason}`,
                `${container_1.E} **Moderador:** <@${interaction.user.id}>`,
                `${container_1.E} **Aviso no privado:** ${dmSent ? "Enviado" : "Nao foi possivel enviar"}`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
    },
};
//# sourceMappingURL=ban.js.map