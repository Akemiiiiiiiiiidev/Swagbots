"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceGuildChannelId = replaceGuildChannelId;
exports.nukeTextChannel = nukeTextChannel;
const database_1 = require("../database");
const instagram_1 = require("./instagram");
function replaceGuildChannelId(guildId, oldChannelId, newChannelId) {
    if ((0, instagram_1.getInstagramChannel)(guildId) === oldChannelId) {
        (0, instagram_1.setInstagramChannel)(guildId, newChannelId);
    }
    (0, database_1.getDatabase)()
        .prepare(`
    UPDATE instagram_posts
    SET channel_id = ?
    WHERE guild_id = ? AND channel_id = ?
  `)
        .run(newChannelId, guildId, oldChannelId);
    (0, database_1.getDatabase)()
        .prepare(`
    UPDATE log_channels
    SET channel_id = ?
    WHERE guild_id = ? AND channel_id = ?
  `)
        .run(newChannelId, guildId, oldChannelId);
}
async function nukeTextChannel(channel, reason) {
    const guild = channel.guild;
    const position = channel.rawPosition;
    const newChannel = await channel.clone({
        name: channel.name,
        reason,
    });
    await newChannel.setPosition(position).catch(() => null);
    replaceGuildChannelId(guild.id, channel.id, newChannel.id);
    await channel.delete(reason);
    return newChannel;
}
//# sourceMappingURL=nukeChannel.js.map