import { Client, Events } from "discord.js";
import {
  cacheTicketMessage,
  initTicketMessageCache,
} from "../utils/ticketMessageCache";

export function registerTicketMessageCache(client: Client) {
  initTicketMessageCache();

  client.on(Events.MessageCreate, (message) => {
    cacheTicketMessage(message);
  });

  client.on(Events.MessageUpdate, (_oldMessage, newMessage) => {
    cacheTicketMessage(newMessage);
  });
}
