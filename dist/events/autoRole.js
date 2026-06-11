"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoRole = registerAutoRole;
const discord_js_1 = require("discord.js");
const autoRole_1 = require("../utils/autoRole");
function registerAutoRole(client) {
    (0, autoRole_1.initAutoRole)();
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        if (member.user.bot)
            return;
        const result = await (0, autoRole_1.assignAutoRole)(member);
        if (!result.success && result.error !== "O membro ja possui este cargo.") {
            if (result.error !== "Cargo automatico nao configurado.") {
                console.error(`Erro ao setar cargo automatico em ${member.user.tag}: ${result.error}`);
            }
        }
    });
}
//# sourceMappingURL=autoRole.js.map