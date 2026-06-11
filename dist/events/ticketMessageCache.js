"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTicketMessageCache = registerTicketMessageCache;
const discord_js_1 = require("discord.js");
const ticketMessageCache_1 = require("../utils/ticketMessageCache");
function registerTicketMessageCache(client) {
    (0, ticketMessageCache_1.initTicketMessageCache)();
    client.on(discord_js_1.Events.MessageCreate, (message) => {
        (0, ticketMessageCache_1.cacheTicketMessage)(message);
    });
    client.on(discord_js_1.Events.MessageUpdate, (_oldMessage, newMessage) => {
        (0, ticketMessageCache_1.cacheTicketMessage)(newMessage);
    });
}
//# sourceMappingURL=ticketMessageCache.js.map