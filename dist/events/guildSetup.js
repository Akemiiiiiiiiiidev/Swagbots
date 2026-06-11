"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGuildSetup = registerGuildSetup;
const discord_js_1 = require("discord.js");
const logs_1 = require("../utils/logs");
async function handleGuildCreate(guild) {
    console.log(`Bot adicionado ao servidor: ${guild.name} (${guild.id})`);
    try {
        await guild.members.fetchMe();
        await (0, logs_1.setupLogChannels)(guild);
        console.log(`Canais de log criados em: ${guild.name}`);
    }
    catch (error) {
        console.error(`Erro ao criar canais de log em ${guild.name}:`, error);
    }
}
function registerGuildSetup(client) {
    client.on(discord_js_1.Events.GuildCreate, handleGuildCreate);
}
//# sourceMappingURL=guildSetup.js.map