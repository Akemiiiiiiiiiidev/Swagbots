"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logs = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const logs_1 = require("../utils/logs");
exports.logs = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("logs").setDescription("Configura o sistema de logs do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub.setName("criar").setDescription("Cria os canais de log automaticamente")),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
            return;
        }
        if (interaction.options.getSubcommand() !== "criar")
            return;
        await interaction.deferReply({ ephemeral: true });
        const channels = await (0, logs_1.setupLogChannels)(guild);
        await interaction.editReply((0, container_1.containerEditOrganized)([
            "# **LOGS**",
            [
                `${container_1.V} **Canais criados**`,
                `${container_1.E} **Categoria:** LOGS`,
                `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                "",
                `${container_1.E} **Canais:**`,
                channels.join("\n"),
                "",
                `${container_1.E} **Tipos:**`,
                Object.values(logs_1.LOG_TYPES).map((c) => `${container_1.E} **${c.title}:** #${c.channel}`).join("\n"),
            ].join("\n"),
            `${container_1.E} O bot registrara comandos e acoes automaticamente nestes canais.`,
        ]));
    },
};
//# sourceMappingURL=logs.js.map