import { Client, Events } from "discord.js";
import { assignAutoRole, initAutoRole } from "../utils/autoRole";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function registerAutoRole(client: Client) {
  initAutoRole();

  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot) return;

    console.log(`[AutoRole] Membro entrou: ${member.user.tag} (${member.id}) no servidor ${member.guild.name}`);

    // Aguarda 2s para garantir que o membro está totalmente carregado
    await wait(2000);

    // Re-fetch para garantir dados atualizados (cargos, permissões)
    const freshMember = await member.guild.members.fetch(member.id).catch(() => member);

    const result = await assignAutoRole(freshMember);

    if (result.success) {
      console.log(`[AutoRole] Cargo <${result.role.id}> aplicado em ${freshMember.user.tag}`);
    } else {
      if (result.error !== "O membro ja possui este cargo." && result.error !== "Cargo automatico nao configurado.") {
        console.error(`[AutoRole] Erro ao setar cargo em ${freshMember.user.tag}: ${result.error}`);
      }
    }
  });
}
