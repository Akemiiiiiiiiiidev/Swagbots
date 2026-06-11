"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcome = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const welcome_1 = require("../utils/welcome");
exports.welcome = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Configura a mensagem de boas-vindas do servidor")
        .addSubcommand((sub) => sub
        .setName("setup")
        .setDescription("Define o canal e a mensagem de boas-vindas")
        .addChannelOption((option) => option
        .setName("canal")
        .setDescription("Canal para enviar as boas-vindas")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)
        .setRequired(true))
        .addStringOption((option) => option
        .setName("mensagem")
        .setDescription("Mensagem de boas-vindas")
        .setRequired(true)
        .setMaxLength(1000)))
        .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra a configuracao de boas-vindas"))
        .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao de boas-vindas")),
    async execute(interaction) {
        (0, welcome_1.initWelcome)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "ver") {
            const config = (0, welcome_1.getWelcomeConfig)(guild.id);
            if (!config) {
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    `${container_1.E} Nenhuma mensagem de boas-vindas configurada.`,
                    `${container_1.E} Use /welcome setup para configurar.`,
                ], { ephemeral: true }));
                return;
            }
            const preview = (0, welcome_1.formatWelcomeMessage)(config.message, guild, interaction.user.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **BOAS-VINDAS**",
                [
                    `${container_1.E} **Canal:**`,
                    `<#${config.channelId}>`,
                    "",
                    `${container_1.E} **Mensagem:**`,
                    config.message,
                    "",
                    `${container_1.E} **Preview:**`,
                    preview,
                ].join("\n"),
                (0, welcome_1.getWelcomePlaceholderHelp)(),
            ]));
            return;
        }
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
            return;
        }
        if (subcommand === "remover") {
            (0, welcome_1.clearWelcomeConfig)(guild.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **BOAS-VINDAS**",
                [
                    `${container_1.E} **Configuracao removida**`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Novos membros nao receberao mais mensagem de boas-vindas.`,
            ]));
            return;
        }
        if (subcommand === "setup") {
            const channel = interaction.options.getChannel("canal", true);
            const message = interaction.options.getString("mensagem", true).trim();
            if (channel.type !== discord_js_1.ChannelType.GuildText) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Selecione um canal de texto valido.`], { ephemeral: true }));
                return;
            }
            if (!message) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} A mensagem de boas-vindas nao pode estar vazia.`], { ephemeral: true }));
                return;
            }
            (0, welcome_1.setWelcomeConfig)(guild.id, channel.id, message);
            const preview = (0, welcome_1.formatWelcomeMessage)(message, guild, interaction.user.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **BOAS-VINDAS**",
                [
                    `${container_1.E} **Configuracao salva**`,
                    `${container_1.E} **Canal:** <#${channel.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    "",
                    `${container_1.E} **Mensagem:**`,
                    message,
                    "",
                    `${container_1.E} **Preview:**`,
                    preview,
                ].join("\n"),
                (0, welcome_1.getWelcomePlaceholderHelp)(),
            ]));
        }
    },
};
//# sourceMappingURL=welcome.js.map