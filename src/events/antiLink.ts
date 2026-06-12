import { Client, Events, PermissionFlagsBits, TextChannel } from "discord.js";
import { isProtectionEnabled } from "../utils/protection";

// Detecta URLs: http(s)://, www., discord.gg/, .com/.net/.org etc
const LINK_REGEX =
  /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+|\S+\.(com|net|org|io|gg|tv|me|app|dev|xyz|club|link|site|online|store|shop|info|co)(\/\S*)?/gi;

export function registerAntiLink(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    if (!message.guild) return;
    if (message.author.bot) return;

    if (!isProtectionEnabled(message.guild.id, "anti_link")) return;

    // Admins podem mandar links
    const member = message.member;
    if (!member) return;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return;

    if (!LINK_REGEX.test(message.content)) return;

    // Reset do regex (global flag mantém lastIndex)
    LINK_REGEX.lastIndex = 0;

    try {
      await message.delete();
    } catch {
      // Mensagem já foi deletada ou sem permissão
    }
  });
}
