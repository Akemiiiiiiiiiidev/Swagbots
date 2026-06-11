import { Client, Events } from "discord.js";
import { incrementMessageCount } from "../utils/messageCount";

export function registerMessageCounter(client: Client) {
  client.on(Events.MessageCreate, (message) => {
    if (!message.guild || message.author.bot) return;

    incrementMessageCount(message.guild.id, message.author.id);
  });
}
