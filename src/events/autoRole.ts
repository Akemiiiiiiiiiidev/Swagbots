import { Client, Events } from "discord.js";
import { assignAutoRole, initAutoRole } from "../utils/autoRole";

export function registerAutoRole(client: Client) {
  initAutoRole();

  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;

    const result = await assignAutoRole(member);

    if (!result.success && result.error !== "O membro ja possui este cargo.") {
      if (result.error !== "Cargo automatico nao configurado.") {
        console.error(
          `Erro ao setar cargo automatico em ${member.user.tag}: ${result.error}`
        );
      }
    }
  });
}
