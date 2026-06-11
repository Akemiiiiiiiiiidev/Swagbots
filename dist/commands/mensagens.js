"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mensagens = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const messageCount_1 = require("../utils/messageCount");
const LIVE_UPDATE_MS = 5000;
const LIVE_UPDATE_DURATION_MS = 120_000;
function buildTopRanking(guildId) {
    const top = (0, messageCount_1.getTopMessageCounts)(guildId, 5);
    if (top.length === 0) {
        return `${container_1.E} Nenhuma mensagem registrada nesta semana.`;
    }
    return top
        .map((entry, index) => `${container_1.E} **${index + 1}.** <@${entry.userId}> - **${entry.count}** mensagens`)
        .join("\n");
}
function buildMensagensSections(guildId, targetUserId) {
    const count = (0, messageCount_1.getUserMessageCount)(guildId, targetUserId);
    const nextReset = (0, messageCount_1.getNextSundayTimestamp)();
    return [
        "# **MENSAGENS**",
        [
            `${container_1.E} **Usuario:** <@${targetUserId}>`,
            `${container_1.E} **Mensagens esta semana:** ${count}`,
            `${container_1.E} **Proximo reset:** <t:${nextReset}:R> (domingo)`,
        ].join("\n"),
        [`${container_1.E} **TOP 5**`, buildTopRanking(guildId)].join("\n"),
    ];
}
exports.mensagens = {
    defer: true,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("mensagens")
        .setDescription("Mostra contagem de mensagens da semana e o top 5")
        .addUserOption((option) => option.setName("membro").setDescription("Membro para consultar").setRequired(false)),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`]));
            return;
        }
        const target = interaction.options.getUser("membro") ?? interaction.user;
        const updateMessage = async () => {
            await interaction.editReply((0, container_1.containerEditOrganized)(buildMensagensSections(guild.id, target.id)));
        };
        await updateMessage();
        const interval = setInterval(async () => {
            try {
                await updateMessage();
            }
            catch {
                clearInterval(interval);
            }
        }, LIVE_UPDATE_MS);
        setTimeout(() => clearInterval(interval), LIVE_UPDATE_DURATION_MS);
    },
};
//# sourceMappingURL=mensagens.js.map