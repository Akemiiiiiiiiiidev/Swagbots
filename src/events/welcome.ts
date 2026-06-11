import { Client, Events } from "discord.js";
import { initWelcome, sendWelcomeMessage } from "../utils/welcome";

export function registerWelcome(client: Client) {
  initWelcome();

  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;

    try {
      await sendWelcomeMessage(member);
    } catch (error) {
      console.error(
        `Erro ao enviar boas-vindas para ${member.user.tag}:`,
        error
      );
    }
  });
}
