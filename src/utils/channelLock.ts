import {
  ChannelType,
  Guild,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export function resolveTextChannel(
  guild: Guild,
  channelId: string | null,
  currentChannelId: string
): TextChannel | null {
  const targetId = channelId ?? currentChannelId;
  const channel = guild.channels.cache.get(targetId);

  if (
    !channel ||
    (channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement)
  ) {
    return null;
  }

  return channel as TextChannel;
}

export async function lockChannel(channel: TextChannel, guild: Guild) {
  await channel.permissionOverwrites.edit(guild.id, {
    SendMessages: false,
    AddReactions: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
}

export async function unlockChannel(channel: TextChannel, guild: Guild) {
  await channel.permissionOverwrites.edit(guild.id, {
    SendMessages: null,
    AddReactions: null,
    SendMessagesInThreads: null,
    CreatePublicThreads: null,
    CreatePrivateThreads: null,
  });
}

export function isChannelLocked(channel: TextChannel, guild: Guild): boolean {
  const overwrite = channel.permissionOverwrites.cache.get(guild.id);
  return overwrite?.deny.has(PermissionFlagsBits.SendMessages) ?? false;
}
