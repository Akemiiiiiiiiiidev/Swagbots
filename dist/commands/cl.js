"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cl = void 0;
const discord_js_1 = require("discord.js");
const clearChannel_1 = require("../utils/clearChannel");
const channelLock_1 = require("../utils/channelLock");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
exports.cl = {
    defer: true,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cl")
        .setDescription("Apaga todas as mensagens do chat")
        .addChannelOption((o) => o.setName("canal").setDescription("Canal para limpar")
        .addChannelTypes(discord_js_1.ChannelType.GuildText, discord_js_1.ChannelType.GuildAnnouncement).setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, discord_js_1.PermissionFlagsBits.ManageMessages);
        if (permissionError) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} ${permissionError}`]));
            return;
        }
        const guild = interaction.guild;
        const channelOption = interaction.options.getChannel("canal");
        const channel = (0, channelLock_1.resolveTextChannel)(guild, channelOption?.id ?? null, interaction.channelId);
        if (!channel) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Selecione um canal de texto válido.`]));
            return;
        }
        const botPermissions = channel.permissionsFor(guild.members.me);
        if (!botPermissions?.has(discord_js_1.PermissionFlagsBits.ManageMessages)) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Não tenho permissão para apagar mensagens em <#${channel.id}>.`]));
            return;
        }
        const { deleted, failed } = await (0, clearChannel_1.clearChannelMessages)(channel);
        await interaction.editReply((0, container_1.containerEditOrganized)([
            "# **CL**",
            [
                `${container_1.V} **Chat limpo**`,
                `${container_1.E} **Canal:** <#${channel.id}>`,
                `${container_1.E} **Mensagens apagadas:** ${deleted}`,
                failed > 0 ? `${container_1.E} **Falhas:** ${failed}` : "",
                `${container_1.E} **Moderador:** <@${interaction.user.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].filter(Boolean).join("\n"),
        ]));
    },
};
//# sourceMappingURL=cl.js.map