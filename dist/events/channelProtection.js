"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChannelProtection = registerChannelProtection;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
const autoRole_1 = require("../utils/autoRole");
// Aguarda ms (audit log tem latência)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// ── Serializa as permissões de um canal para restauração ──────────────────────
function serializeOverwrites(channel) {
    return channel.permissionOverwrites.cache.map((overwrite) => ({
        id: overwrite.id,
        type: overwrite.type,
        allow: overwrite.allow,
        deny: overwrite.deny,
    }));
}
// ── Pune o executor (remove todos os cargos exceto autorole) ─────────────────
async function punishExecutor(guild, executorId) {
    if (!executorId)
        return;
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
        .filter((r) => r.id !== guild.id &&
        r.position < botMember.roles.highest.position &&
        (autoRoleId ? r.id !== autoRoleId : true))
        .map((r) => r.id);
    try {
        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove, "Protecao de canais: acao nao autorizada");
        }
    }
    catch (err) {
        console.error("[ChannelProtection] Erro ao punir executor:", err);
    }
    await (0, logs_1.sendLog)(guild, "call", [
        [
            `${container_1.E} **⚠️ Protecao de canais ativada**`,
            `${container_1.E} **Executor punido:** <@${executorId}>`,
            `${container_1.E} **Acao:** Todos os cargos removidos`,
            `${container_1.E} **Motivo:** Tentativa de alterar/mover/deletar canal sem permissao de Administrador`,
            `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
    ]);
}
// ── Handler: canal deletado ───────────────────────────────────────────────────
async function handleChannelDelete(guild, entry) {
    if (!entry.executor)
        return;
    if (entry.executor.id === guild.client.user?.id)
        return;
    await wait(300);
    const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!executor)
        return;
    if (executor.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return;
    // Coleta dados do canal deletado dos changes do audit log
    const changes = entry.changes ?? [];
    const name = changes.find((c) => c.key === "name")?.old ??
        "canal-restaurado";
    const typeRaw = changes.find((c) => c.key === "type")?.old ?? 0;
    const parentIdChange = changes.find((c) => c.key === "parent_id");
    const parentId = parentIdChange?.old ?? undefined;
    const position = changes.find((c) => c.key === "position")?.old ?? 0;
    const overwrites = changes.find((c) => c.key === "permission_overwrites")?.old ?? [];
    // Mapeia type number para ChannelType
    const channelTypeMap = {
        0: discord_js_1.ChannelType.GuildText,
        2: discord_js_1.ChannelType.GuildVoice,
        4: discord_js_1.ChannelType.GuildCategory,
        5: discord_js_1.ChannelType.GuildAnnouncement,
        13: discord_js_1.ChannelType.GuildStageVoice,
        15: discord_js_1.ChannelType.GuildForum,
    };
    const channelType = channelTypeMap[typeRaw] ?? discord_js_1.ChannelType.GuildText;
    try {
        await guild.channels.create({
            name,
            type: channelType,
            parent: parentId,
            position,
            permissionOverwrites: overwrites,
            reason: "Protecao de canais: restaurando canal deletado",
        });
        await (0, logs_1.sendLog)(guild, "call", [
            [
                `${container_1.E} **⚠️ Canal deletado e restaurado**`,
                `${container_1.E} **Canal:** ${name}`,
                `${container_1.E} **Executor:** <@${entry.executor.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
    }
    catch (err) {
        console.error("[ChannelProtection] Erro ao recriar canal:", err);
    }
    await punishExecutor(guild, entry.executor.id);
}
// ── Handler: canal atualizado (movido ou renomeado) ───────────────────────────
async function handleChannelUpdate(guild, entry) {
    if (!entry.executor)
        return;
    if (entry.executor.id === guild.client.user?.id)
        return;
    await wait(300);
    const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!executor)
        return;
    if (executor.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return;
    const channel = entry.target;
    if (!channel)
        return;
    // Reverte as mudanças
    const changes = entry.changes ?? [];
    const patch = {};
    for (const change of changes) {
        const key = change.key;
        if (["name", "parent_id", "position", "topic", "bitrate", "user_limit"].includes(key)) {
            const patchKey = key === "parent_id" ? "parentId" : key;
            patch[patchKey] = change.old ?? null;
        }
    }
    if (Object.keys(patch).length > 0) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await channel.edit(patch);
            await (0, logs_1.sendLog)(guild, "call", [
                [
                    `${container_1.E} **⚠️ Alteracao de canal revertida**`,
                    `${container_1.E} **Canal:** <#${channel.id}>`,
                    `${container_1.E} **Executor:** <@${entry.executor.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
        }
        catch (err) {
            console.error("[ChannelProtection] Erro ao reverter canal:", err);
        }
    }
    await punishExecutor(guild, entry.executor.id);
}
// ── Handler: overwrite de permissão alterado ──────────────────────────────────
async function handleChannelOverwriteUpdate(guild, entry) {
    if (!entry.executor)
        return;
    if (entry.executor.id === guild.client.user?.id)
        return;
    await wait(300);
    const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!executor)
        return;
    if (executor.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
        return;
    const channel = entry.target;
    if (!channel)
        return;
    // Não temos o estado anterior das overwrites de forma confiável,
    // mas punimos quem tentou alterar permissões sem ser admin
    await punishExecutor(guild, entry.executor.id);
}
const protection_1 = require("../utils/protection");
// ── Registro ──────────────────────────────────────────────────────────────────
function registerChannelProtection(client) {
    client.on(discord_js_1.Events.GuildAuditLogEntryCreate, async (entry, guild) => {
        if (!(0, protection_1.isProtectionEnabled)(guild.id, "channel_protection"))
            return;
        try {
            switch (entry.action) {
                case discord_js_1.AuditLogEvent.ChannelDelete:
                    await handleChannelDelete(guild, entry);
                    break;
                case discord_js_1.AuditLogEvent.ChannelUpdate:
                    await handleChannelUpdate(guild, entry);
                    break;
                case discord_js_1.AuditLogEvent.ChannelOverwriteCreate:
                case discord_js_1.AuditLogEvent.ChannelOverwriteUpdate:
                case discord_js_1.AuditLogEvent.ChannelOverwriteDelete:
                    await handleChannelOverwriteUpdate(guild, entry);
                    break;
            }
        }
        catch (error) {
            console.error("[ChannelProtection] Erro:", error);
        }
    });
}
//# sourceMappingURL=channelProtection.js.map