"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAntiLink = registerAntiLink;
const discord_js_1 = require("discord.js");
// Detecta URLs: http(s)://, www., discord.gg/, .com/.net/.org etc
const LINK_REGEX = /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+|\S+\.(com|net|org|io|gg|tv|me|app|dev|xyz|club|link|site|online|store|shop|info|co)(\/\S*)?/gi;
function registerAntiLink(client) {
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (!message.guild)
            return;
        if (message.author.bot)
            return;
        // Admins podem mandar links
        const member = message.member;
        if (!member)
            return;
        if (member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
            return;
        if (!LINK_REGEX.test(message.content))
            return;
        // Reset do regex (global flag mantém lastIndex)
        LINK_REGEX.lastIndex = 0;
        try {
            await message.delete();
        }
        catch {
            // Mensagem já foi deletada ou sem permissão
        }
    });
}
//# sourceMappingURL=antiLink.js.map