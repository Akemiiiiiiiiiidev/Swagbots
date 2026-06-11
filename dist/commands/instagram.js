"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instagram = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const instagram_1 = require("../utils/instagram");
const moderation_1 = require("../utils/moderation");
exports.instagram = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("instagram")
        .setDescription("Sistema de instagram do servidor")
        .addSubcommand((sub) => sub
        .setName("setup")
        .setDescription("Define o canal de publicacoes")
        .addChannelOption((option) => option
        .setName("canal")
        .setDescription("Canal do instagram")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)
        .setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("perfil")
        .setDescription("Mostra o perfil de instagram")
        .addUserOption((option) => option.setName("membro").setDescription("Membro para consultar").setRequired(false))),
    async execute(interaction) {
        (0, instagram_1.initInstagram)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "setup") {
            const adminError = await (0, moderation_1.checkAdministrator)(interaction);
            if (adminError) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
                return;
            }
            const channel = interaction.options.getChannel("canal", true);
            if (channel.type !== discord_js_1.ChannelType.GuildText) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Selecione um canal de texto valido.`], { ephemeral: true }));
                return;
            }
            (0, instagram_1.setInstagramChannel)(guild.id, channel.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                [
                    `${container_1.E} **Canal configurado**`,
                    `${container_1.E} **Canal:** <#${channel.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Envie uma foto nesse canal para publicar automaticamente.`,
            ]));
            return;
        }
        if (subcommand === "perfil") {
            const target = interaction.options.getUser("membro") ?? interaction.user;
            const stats = (0, instagram_1.getUserStats)(guild.id, target.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                [
                    `${container_1.E} **Perfil:** <@${target.id}>`,
                    `${container_1.E} **Publicacoes:** ${stats.posts}`,
                    `${container_1.E} **Curtidas recebidas:** ${stats.likesReceived}`,
                    `${container_1.E} **Curtidas dadas:** ${stats.likesGiven}`,
                    `${container_1.E} **Comentários:** ${stats.comments}`,
                ].join("\n"),
            ]));
        }
    },
};
//# sourceMappingURL=instagram.js.map