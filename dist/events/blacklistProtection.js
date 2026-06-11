"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistIntents = exports.botIntents = void 0;
exports.registerBlacklistProtection = registerBlacklistProtection;
exports.getBotIntents = getBotIntents;
const discord_js_1 = require("discord.js");
const blacklist_1 = require("../utils/blacklist");
function registerBlacklistProtection(client) {
    (0, blacklist_1.initBlacklist)();
    client.on(discord_js_1.Events.GuildBanRemove, async (ban) => {
        if (!(0, blacklist_1.isBlacklisted)(ban.guild.id, ban.user.id))
            return;
        try {
            const auditLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: discord_js_1.AuditLogEvent.MemberBanRemove,
            });
            const entry = auditLogs.entries.first();
            if (entry?.target?.id === ban.user.id && entry.executor) {
                if (entry.executor.id === ban.client.user?.id)
                    return;
                if (await isExecutorAdministrator(ban.guild, entry.executor.id)) {
                    (0, blacklist_1.removeFromBlacklist)(ban.guild.id, ban.user.id);
                    return;
                }
            }
            await ban.guild.members.ban(ban.user.id, {
                reason: "Usuario na blacklist - desbanimento negado",
            });
        }
        catch (error) {
            console.error("Erro ao proteger blacklist:", error);
            try {
                await ban.guild.members.ban(ban.user.id, {
                    reason: "Usuario na blacklist - desbanimento negado",
                });
            }
            catch {
                // Ignora falha ao rebanir
            }
        }
    });
}
exports.botIntents = [
    discord_js_1.GatewayIntentBits.Guilds,
    discord_js_1.GatewayIntentBits.GuildVoiceStates,
    discord_js_1.GatewayIntentBits.GuildModeration,
    discord_js_1.GatewayIntentBits.GuildMessages,
];
function getBotIntents() {
    const intents = [...exports.botIntents];
    if (process.env.MESSAGE_CONTENT_INTENT === "true") {
        intents.push(discord_js_1.GatewayIntentBits.MessageContent);
    }
    return intents;
}
exports.blacklistIntents = getBotIntents();
async function isExecutorAdministrator(guild, userId) {
    const member = await guild.members.fetch(userId).catch(() => null);
    return member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
}
//# sourceMappingURL=blacklistProtection.js.map