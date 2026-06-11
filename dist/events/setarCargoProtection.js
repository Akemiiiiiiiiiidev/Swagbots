"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSetarCargoProtection = registerSetarCargoProtection;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const autoRole_1 = require("../utils/autoRole");
const setarCargo_1 = require("../utils/setarCargo");
async function handleMemberRoleUpdate(guild, entry) {
    if (!entry.executor)
        return;
    // Ignora APENAS o próprio bot
    if (entry.executor.id === guild.client.user?.id)
        return;
    const botMember = guild.members.me;
    if (!botMember)
        return;
    const botHighest = botMember.roles.highest.position;
    // Garante que o cache de roles está atualizado
    await guild.roles.fetch();
    // Lê os cargos adicionados e removidos do audit log
    const changes = entry.changes ?? [];
    const added = [];
    const removed = [];
    for (const change of changes) {
        // Discord usa change.new para listar os cargos afetados em $add e $remove
        const list = change.new ?? [];
        if (change.key === "$add") {
            for (const r of list)
                added.push(r.id);
        }
        if (change.key === "$remove") {
            for (const r of list)
                removed.push(r.id);
        }
    }
    if (added.length === 0 && removed.length === 0)
        return;
    // Busca o membro alvo atualizado
    const targetId = entry.target?.id;
    if (!targetId)
        return;
    const member = await guild.members.fetch({ user: targetId, force: true }).catch(() => null);
    if (!member)
        return;
    // Reverte adições: remove cada cargo adicionado manualmente
    for (const roleId of added) {
        const role = guild.roles.cache.get(roleId);
        if (!role)
            continue;
        try {
            await member.roles.remove(roleId, "SetarCargo: revertendo adicao manual");
        }
        catch (err) {
            console.error(`[SetarCargo] Nao foi possivel remover cargo ${role.name} (${roleId}) do membro ${member.user.tag}:`, err);
        }
    }
    // Reverte remoções: readiciona cada cargo removido manualmente
    for (const roleId of removed) {
        const role = guild.roles.cache.get(roleId);
        if (!role)
            continue;
        try {
            await member.roles.add(roleId, "SetarCargo: revertendo remocao manual");
        }
        catch (err) {
            console.error(`[SetarCargo] Nao foi possivel readicionar cargo ${role.name} (${roleId}) ao membro ${member.user.tag}:`, err);
        }
    }
    // Pune o executor: remove todos os cargos que o bot conseguir remover
    const executor = await guild.members.fetch({ user: entry.executor.id, force: true }).catch(() => null);
    if (executor && executor.id !== guild.ownerId) {
        const autoRoleId = (0, autoRole_1.getAutoRoleId)(guild.id);
        const rolesToRemove = executor.roles.cache
            .filter((r) => r.id !== guild.id &&
            r.position < botHighest &&
            (autoRoleId ? r.id !== autoRoleId : true))
            .map((r) => r.id);
        if (rolesToRemove.length > 0) {
            try {
                await executor.roles.remove(rolesToRemove, "SetarCargo: alteracao manual nao autorizada");
            }
            catch (err) {
                console.error("[SetarCargo] Erro ao punir executor:", err);
            }
        }
    }
    const roleList = [
        ...added.map((id) => `+<@&${id}>`),
        ...removed.map((id) => `-<@&${id}>`),
    ].join(", ");
    await (0, logs_1.sendLog)(guild, "cargo", [
        [
            `${container_1.E} **⚠️ Alteracao manual de cargo revertida**`,
            `${container_1.E} **Executor:** <@${entry.executor.id}>`,
            `${container_1.E} **Alvo:** <@${targetId}>`,
            `${container_1.E} **Cargos:** ${roleList}`,
            `${container_1.E} **Acao:** Alteracao revertida e cargos do executor removidos`,
            `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
    ]);
}
function registerSetarCargoProtection(client) {
    client.on(discord_js_1.Events.GuildAuditLogEntryCreate, async (entry, guild) => {
        try {
            if (!(0, setarCargo_1.isSetarCargoProtectionEnabled)(guild.id))
                return;
            if (entry.action !== discord_js_1.AuditLogEvent.MemberRoleUpdate)
                return;
            await handleMemberRoleUpdate(guild, entry);
        }
        catch (error) {
            console.error("Erro na protecao de setar cargo:", error);
        }
    });
}
//# sourceMappingURL=setarCargoProtection.js.map