"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatTriggers = registerChatTriggers;
const discord_js_1 = require("discord.js");
const clearChannel_1 = require("../utils/clearChannel");
const nukeChannel_1 = require("../utils/nukeChannel");
const pd_1 = require("../utils/pd");
const pdInteractions_1 = require("./pdInteractions");
function canUseTrigger(member, botMember, permission) {
    return (member.permissions.has(permission) &&
        Boolean(botMember?.permissions.has(permission)));
}
function registerChatTriggers(client) {
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild)
            return;
        if (!message.channel.isTextBased() || message.channel.isDMBased())
            return;
        const member = message.member;
        if (!member)
            return;
        const content = message.content.trim();
        const lower = content.toLowerCase();
        const channel = message.channel;
        const guild = message.guild;
        const botMember = guild.members.me;
        // ── toctoc / toc ─────────────────────────────────────────────────────────
        if (lower === "toctoc" || lower === "toc") {
            if (lower === "toctoc") {
                if (!botMember?.permissionsIn(channel).has(discord_js_1.PermissionFlagsBits.ManageMessages))
                    return;
                try {
                    await message.delete().catch(() => null);
                    await (0, clearChannel_1.clearUserMessages)(channel, message.author.id);
                }
                catch (error) {
                    console.error("Erro ao apagar mensagens do usuario (toctoc):", error);
                }
                return;
            }
            if (!canUseTrigger(member, botMember, discord_js_1.PermissionFlagsBits.ManageChannels))
                return;
            try {
                await (0, nukeChannel_1.nukeTextChannel)(channel, `Canal nukado por ${message.author.tag}`);
            }
            catch (error) {
                console.error("Erro ao nukar chat (toc):", error);
            }
            return;
        }
        // ── choco!pd config — painel admin ────────────────────────────────────────
        if (lower === "choco!pd config") {
            (0, pd_1.initPd)();
            const isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            if (!isAdmin) {
                await message.reply("Apenas administradores podem usar `choco!pd config`.");
                return;
            }
            try {
                await message.delete().catch(() => null);
            }
            catch { /* sem permissao */ }
            await channel.send({
                components: [(0, pdInteractions_1.buildPdAdminPanel)(guild.id)],
                flags: discord_js_1.MessageFlags.IsComponentsV2,
            });
            return;
        }
        // ── choco!pd — painel de usuário ──────────────────────────────────────────
        if (lower === "choco!pd") {
            (0, pd_1.initPd)();
            const isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
            const memberRoleIds = member.roles.cache.map((r) => r.id);
            const hasAccess = isAdmin || (0, pd_1.memberHasPdAccess)(guild.id, memberRoleIds);
            if (!hasAccess) {
                const reply = await message.reply("Voce nao tem permissao para usar este painel.");
                setTimeout(() => reply.delete().catch(() => null), 4000);
                await message.delete().catch(() => null);
                return;
            }
            try {
                await message.delete().catch(() => null);
            }
            catch { /* sem permissao */ }
            // Admin usando choco!pd também vê o painel de usuário (sem config)
            const panel = (0, pdInteractions_1.buildPdUserPanel)(guild.id, member.id);
            await channel.send({
                components: [panel],
                flags: discord_js_1.MessageFlags.IsComponentsV2,
            });
            return;
        }
    });
}
//# sourceMappingURL=chatTriggers.js.map