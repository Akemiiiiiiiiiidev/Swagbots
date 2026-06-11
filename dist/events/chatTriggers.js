"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatTriggers = registerChatTriggers;
const discord_js_1 = require("discord.js");
const clearChannel_1 = require("../utils/clearChannel");
const nukeChannel_1 = require("../utils/nukeChannel");
function canUseTrigger(member, botMember, permission) {
    return (member.permissions.has(permission) &&
        Boolean(botMember?.permissions.has(permission)));
}
function registerChatTriggers(client) {
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild)
            return;
        if (!message.channel.isTextBased() || message.channel.isDMBased())
            return;
        const member = message.member;
        if (!member)
            return;
        const lower = message.content.trim().toLowerCase();
        if (lower !== "toctoc" && lower !== "toc")
            return;
        const channel = message.channel;
        const botMember = message.guild.members.me;
        if (lower === "toctoc") {
            if (!botMember?.permissionsIn(channel).has(discord_js_1.PermissionFlagsBits.ManageMessages)) {
                return;
            }
            try {
                await message.delete().catch(() => null);
                await (0, clearChannel_1.clearUserMessages)(channel, message.author.id);
            }
            catch (error) {
                console.error("Erro ao apagar mensagens do usuario (toctoc):", error);
            }
            return;
        }
        if (!canUseTrigger(member, botMember, discord_js_1.PermissionFlagsBits.ManageChannels)) {
            return;
        }
        try {
            await (0, nukeChannel_1.nukeTextChannel)(channel, `Canal nukado por ${message.author.tag}`);
        }
        catch (error) {
            console.error("Erro ao nukar chat (toc):", error);
        }
    });
}
//# sourceMappingURL=chatTriggers.js.map