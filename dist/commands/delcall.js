"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delcall = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const SNOWFLAKE_REGEX = /^\d{17,20}$/;
exports.delcall = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("delcall")
        .setDescription("Deleta um canal de voz do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .addChannelOption((option) => option
        .setName("canal")
        .setDescription("Canal de voz para deletar")
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice)
        .setRequired(false))
        .addStringOption((option) => option
        .setName("id")
        .setDescription("ID do canal de voz para deletar")
        .setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, discord_js_1.PermissionFlagsBits.ManageChannels);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReply)(permissionError, { ephemeral: true }));
            return;
        }
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReply)("Este comando só pode ser usado em um servidor.", {
                ephemeral: true,
            }));
            return;
        }
        const channelOption = interaction.options.getChannel("canal");
        const idOption = interaction.options.getString("id");
        if (!channelOption && !idOption) {
            await interaction.reply((0, container_1.containerReply)("Informe o canal de voz ou o ID.", { ephemeral: true }));
            return;
        }
        const channelId = channelOption?.id ?? idOption?.trim();
        if (!channelId || !SNOWFLAKE_REGEX.test(channelId)) {
            await interaction.reply((0, container_1.containerReply)("ID de canal inválido.", { ephemeral: true }));
            return;
        }
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel ||
            (channel.type !== discord_js_1.ChannelType.GuildVoice &&
                channel.type !== discord_js_1.ChannelType.GuildStageVoice)) {
            await interaction.reply((0, container_1.containerReply)("Canal de voz não encontrado neste servidor.", {
                ephemeral: true,
            }));
            return;
        }
        const channelName = channel.name;
        await channel.delete(`${interaction.user.tag}: canal de voz removido`);
        await interaction.reply((0, container_1.containerReply)([
            "**Canal de voz deletado**",
            `**Canal:** ${channelName}`,
            `**ID:** ${channelId}`,
            `**Moderador:** ${interaction.user.tag}`,
        ].join("\n")));
    },
};
//# sourceMappingURL=delcall.js.map