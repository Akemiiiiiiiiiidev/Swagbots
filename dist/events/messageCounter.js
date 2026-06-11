"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMessageCounter = registerMessageCounter;
const discord_js_1 = require("discord.js");
const messageCount_1 = require("../utils/messageCount");
function registerMessageCounter(client) {
    client.on(discord_js_1.Events.MessageCreate, (message) => {
        if (!message.guild || message.author.bot)
            return;
        (0, messageCount_1.incrementMessageCount)(message.guild.id, message.author.id);
    });
}
//# sourceMappingURL=messageCounter.js.map