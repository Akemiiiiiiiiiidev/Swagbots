"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tempcall = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const voiceTime_1 = require("../utils/voiceTime");
const LIVE_UPDATE_MS = 1000;
const LIVE_UPDATE_DURATION_MS = 120_000;
function getCallName(guild, userId) {
    const channel = guild.voiceStates.cache.get(userId)?.channel;
    return channel?.name ?? "Fora de call";
}
function buildTopRanking(guildId) {
    const top = (0, voiceTime_1.getTopVoiceTimes)(guildId, 5);
    if (top.length === 0) {
        return `${container_1.E} Nenhum tempo registrado ainda.`;
    }
    return top
        .map((entry, index) => `${container_1.E} **${index + 1}.** <@${entry.userId}> - ${(0, voiceTime_1.formatVoiceDuration)(entry.totalMs)}`)
        .join("\n");
}
function buildTempcallSections(guild, targetUserId) {
    const totalMs = (0, voiceTime_1.getVoiceTime)(guild.id, targetUserId);
    return [
        "# **TEMPO**",
        [
            `${container_1.E} **Usuário:** <@${targetUserId}>`,
            `${container_1.E} **Tempo total:** ${(0, voiceTime_1.formatVoiceDuration)(totalMs)}`,
            `${container_1.E} **Call:** ${getCallName(guild, targetUserId)}`,
        ].join("\n"),
        [`${container_1.E} **TOP 5**`, buildTopRanking(guild.id)].join("\n"),
    ];
}
exports.tempcall = {
    defer: true,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("tempcall")
        .setDescription("Mostra seu tempo em call e o top 5 do servidor")
        .addUserOption((option) => option.setName("membro").setDescription("Membro para consultar").setRequired(false)),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply((0, container_1.containerEdit)(`${container_1.E} Este comando só pode ser usado em um servidor.`));
            return;
        }
        const target = interaction.options.getUser("membro") ?? interaction.user;
        const updateMessage = async () => {
            await interaction.editReply((0, container_1.containerEditOrganized)(buildTempcallSections(guild, target.id)));
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
//# sourceMappingURL=tempcall.js.map