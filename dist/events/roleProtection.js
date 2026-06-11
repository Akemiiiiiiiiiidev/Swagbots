"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoleProtection = registerRoleProtection;
const discord_js_1 = require("discord.js");
const autoRole_1 = require("../utils/autoRole");
const logs_1 = require("../utils/logs");
const container_1 = require("../utils/container");
const roleProtection_1 = require("../utils/roleProtection");
async function punishExecutor(guild, executorId) {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member)
        return;
    if (member.user.bot)
        return;
    if (member.id === guild.ownerId)
        return;
    const botMember = guild.members.me;
    if (!botMember)
        return;
    if (member.roles.highest.position >= botMember.roles.highest.position)
        return;
    const autoRoleId = (0, autoRole_1.getAutoRoleId)(guild.id);
    const rolesToRemove = member.roles.cache
        .filter((r) => r.id !== guild.id && (autoRoleId ? r.id !== autoRoleId : true))
        .map((r) => r.id);
    try {
        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove, "Protecao de cargos: alteracao nao autorizada");
        }
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.E} **⚠️ Protecao de cargos ativada**`,
                `${container_1.E} **Executor:** <@${executorId}>`,
                `${container_1.E} **Acao:** Todos os cargos foram removidos`,
                `${container_1.E} **Motivo:** Tentativa de alterar/deletar cargo sem permissao de Administrador`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
    }
    catch (error) {
        console.error("Erro ao punir executor na protecao de cargos:", error);
    }
}
async function handleRoleDelete(guild, entry) {
    if (!entry.executor)
        return;
    if (entry.executor.id === guild.client.user?.id)
        return;
    const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!executor)
        return;
    if (executor.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return;
    // Recria o cargo com as propriedades originais
    const changes = entry.changes ?? [];
    const name = changes.find((c) => c.key === "name")?.old ?? "cargo-restaurado";
    const color = changes.find((c) => c.key === "color")?.old ?? 0;
    const hoist = changes.find((c) => c.key === "hoist")?.old ?? false;
    const mentionable = changes.find((c) => c.key === "mentionable")?.old ?? false;
    try {
        await guild.roles.create({
            name,
            color: color,
            hoist,
            mentionable,
            reason: "Protecao de cargos: restaurando cargo deletado",
        });
    }
    catch (error) {
        console.error("Erro ao recriar cargo deletado:", error);
    }
    await punishExecutor(guild, entry.executor.id);
}
async function handleRoleUpdate(guild, entry) {
    if (!entry.executor)
        return;
    if (entry.executor.id === guild.client.user?.id)
        return;
    const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!executor)
        return;
    if (executor.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return;
    // Reverte as alterações no cargo
    const role = entry.target;
    if (role) {
        try {
            const changes = entry.changes ?? [];
            const patch = {};
            for (const change of changes) {
                if (["name", "color", "hoist", "mentionable", "permissions"].includes(change.key)) {
                    patch[change.key] = change.old;
                }
            }
            if (Object.keys(patch).length > 0) {
                await role.edit(patch);
            }
        }
        catch (error) {
            console.error("Erro ao reverter alteracao de cargo:", error);
        }
    }
    await punishExecutor(guild, entry.executor.id);
}
function registerRoleProtection(client) {
    client.on(discord_js_1.Events.GuildAuditLogEntryCreate, async (entry, guild) => {
        try {
            if (!(0, roleProtection_1.isRoleProtectionEnabled)(guild.id))
                return;
            if (entry.action === discord_js_1.AuditLogEvent.RoleDelete) {
                await handleRoleDelete(guild, entry);
            }
            else if (entry.action === discord_js_1.AuditLogEvent.RoleUpdate) {
                await handleRoleUpdate(guild, entry);
            }
        }
        catch (error) {
            console.error("Erro no sistema de protecao de cargos:", error);
        }
    });
}
//# sourceMappingURL=roleProtection.js.map