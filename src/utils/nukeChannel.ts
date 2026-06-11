import { TextChannel } from "discord.js";
import { getDatabase } from "../database";
import {
  getInstagramChannel,
  setInstagramChannel,
} from "./instagram";

export function replaceGuildChannelId(
  guildId: string,
  oldChannelId: string,
  newChannelId: string
) {
  if (getInstagramChannel(guildId) === oldChannelId) {
    setInstagramChannel(guildId, newChannelId);
  }

  getDatabase()
    .prepare(
      `
    UPDATE instagram_posts
    SET channel_id = ?
    WHERE guild_id = ? AND channel_id = ?
  `
    )
    .run(newChannelId, guildId, oldChannelId);

  getDatabase()
    .prepare(
      `
    UPDATE log_channels
    SET channel_id = ?
    WHERE guild_id = ? AND channel_id = ?
  `
    )
    .run(newChannelId, guildId, oldChannelId);
}

export async function nukeTextChannel(channel: TextChannel, reason: string) {
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
