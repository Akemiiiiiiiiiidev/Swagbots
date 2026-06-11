"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWelcome = registerWelcome;
const discord_js_1 = require("discord.js");
const welcome_1 = require("../utils/welcome");
function registerWelcome(client) {
    (0, welcome_1.initWelcome)();
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        if (member.user.bot)
            return;
        try {
            await (0, welcome_1.sendWelcomeMessage)(member);
        }
        catch (error) {
            console.error(`Erro ao enviar boas-vindas para ${member.user.tag}:`, error);
        }
    });
}
//# sourceMappingURL=welcome.js.map