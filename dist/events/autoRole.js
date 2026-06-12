"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoRole = registerAutoRole;
const discord_js_1 = require("discord.js");
const autoRole_1 = require("../utils/autoRole");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function registerAutoRole(client) {
    (0, autoRole_1.initAutoRole)();
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        if (member.user.bot)
            return;
        console.log(`[AutoRole] Membro entrou: ${member.user.tag} (${member.id}) no servidor ${member.guild.name}`);
        // Aguarda 2s para garantir que o membro está totalmente carregado
        await wait(2000);
        // Re-fetch para garantir dados atualizados (cargos, permissões)
        const freshMember = await member.guild.members.fetch(member.id).catch(() => member);
        const result = await (0, autoRole_1.assignAutoRole)(freshMember);
        if (result.success) {
            console.log(`[AutoRole] Cargo <${result.role.id}> aplicado em ${freshMember.user.tag}`);
        }
        else {
            if (result.error !== "O membro ja possui este cargo." && result.error !== "Cargo automatico nao configurado.") {
                console.error(`[AutoRole] Erro ao setar cargo em ${freshMember.user.tag}: ${result.error}`);
            }
        }
    });
}
//# sourceMappingURL=autoRole.js.map