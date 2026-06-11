"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlock = void 0;
const discord_js_1 = require("discord.js");
const channelLock_1 = require("../utils/channelLock");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
exports.unlock = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("unlock").setDescription("Destrava o chat e permite mensagens novamente")
        .addChannelOption((o) => o.setName("canal").setDescription("Canal para destravar").addChannelTypes(discord_js_1.ChannelType.GuildText, discord_js_1.ChannelType.GuildAnnouncement).setRequired(false))
        .addStringOption((o) => o.setName("motivo").setDescription("Motivo do destravamento").setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, discord_js_1.PermissionFlagsBits.ManageChannels);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${permissionError}`], { ephemeral: true }));
            return;
        }
        const guild = interaction.guild;
        const channel = (0, channelLock_1.resolveTextChannel)(guild, interaction.options.getChannel("canal")?.id ?? null, interaction.channelId);
        if (!channel) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Selecione um canal de texto valido.`], { ephemeral: true }));
            return;
        }
        if (!(0, channelLock_1.isChannelLocked)(channel, guild)) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O canal <#${channel.id}> ja esta destravado.`], { ephemeral: true }));
            return;
        }
        const motivo = interaction.options.getString("motivo") ?? "Sem motivo informado";
        await (0, channelLock_1.unlockChannel)(channel, guild);
        await interaction.reply((0, container_1.containerReplyOrganized)([
            "# **UNLOCK**",
            [`${container_1.V} **Chat destravado**`, `${container_1.E} **Canal:** <#${channel.id}>`, `${container_1.E} **Motivo:** ${motivo}`, `${container_1.E} **Moderador:** <@${interaction.user.id}>`, `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`].join("\n"),
        ]));
    },
};
//# sourceMappingURL=unlock.js.map