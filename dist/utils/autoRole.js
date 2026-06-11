"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAutoRole = initAutoRole;
exports.setAutoRole = setAutoRole;
exports.getAutoRoleId = getAutoRoleId;
exports.clearAutoRole = clearAutoRole;
exports.resolveAutoRole = resolveAutoRole;
exports.assignAutoRole = assignAutoRole;
const database_1 = require("../database");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS auto_role_config (
      guild_id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL
    );
  `);
}
function initAutoRole() {
    ensureTable();
}
function setAutoRole(guildId, roleId) {
    initAutoRole();
    (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO auto_role_config (guild_id, role_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET role_id = excluded.role_id
  `)
        .run(guildId, roleId);
}
function getAutoRoleId(guildId) {
    initAutoRole();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT role_id as roleId FROM auto_role_config WHERE guild_id = ?`)
        .get(guildId);
    return row?.roleId ?? null;
}
function clearAutoRole(guildId) {
    initAutoRole();
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM auto_role_config WHERE guild_id = ?`)
        .run(guildId);
}
async function resolveAutoRole(member) {
    const roleId = getAutoRoleId(member.guild.id);
    if (!roleId)
        return null;
    return (member.guild.roles.cache.get(roleId) ??
        (await member.guild.roles.fetch(roleId).catch(() => null)));
}
async function assignAutoRole(member) {
    const role = await resolveAutoRole(member);
    if (!role) {
        return { success: false, error: "Cargo automatico nao configurado." };
    }
    if (member.roles.cache.has(role.id)) {
        return { success: false, error: "O membro ja possui este cargo." };
    }
    const botMember = member.guild.members.me;
    if (!botMember) {
        return {
            success: false,
            error: "Nao foi possivel verificar as permissoes do bot.",
        };
    }
    if (role.position >= botMember.roles.highest.position &&
        member.guild.ownerId !== botMember.id) {
        return {
            success: false,
            error: "O cargo automatico esta acima do meu cargo na hierarquia.",
        };
    }
    try {
        await member.roles.add(role, "Cargo automatico");
        return { success: true, role };
    }
    catch {
        return {
            success: false,
            error: "Nao foi possivel adicionar o cargo ao membro.",
        };
    }
}
//# sourceMappingURL=autoRole.js.map