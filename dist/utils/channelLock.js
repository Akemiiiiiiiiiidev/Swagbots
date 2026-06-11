"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTextChannel = resolveTextChannel;
exports.lockChannel = lockChannel;
exports.unlockChannel = unlockChannel;
exports.isChannelLocked = isChannelLocked;
const discord_js_1 = require("discord.js");
function resolveTextChannel(guild, channelId, currentChannelId) {
    const targetId = channelId ?? currentChannelId;
    const channel = guild.channels.cache.get(targetId);
    if (!channel ||
        (channel.type !== discord_js_1.ChannelType.GuildText &&
            channel.type !== discord_js_1.ChannelType.GuildAnnouncement)) {
        return null;
    }
    return channel;
}
async function lockChannel(channel, guild) {
    await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: false,
        AddReactions: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
    });
}
async function unlockChannel(channel, guild) {
    await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: null,
        AddReactions: null,
        SendMessagesInThreads: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
    });
}
function isChannelLocked(channel, guild) {
    const overwrite = channel.permissionOverwrites.cache.get(guild.id);
    return overwrite?.deny.has(discord_js_1.PermissionFlagsBits.SendMessages) ?? false;
}
//# sourceMappingURL=channelLock.js.map