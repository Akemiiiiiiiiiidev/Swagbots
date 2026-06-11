"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationPermissions = void 0;
exports.parseUserId = parseUserId;
exports.resolveModerationTarget = resolveModerationTarget;
exports.checkModeratorPermissions = checkModeratorPermissions;
exports.checkModerationHierarchy = checkModerationHierarchy;
exports.formatDuration = formatDuration;
exports.fetchGuildMember = fetchGuildMember;
exports.fetchExecutorMember = fetchExecutorMember;
exports.isAdministrator = isAdministrator;
exports.checkAdministrator = checkAdministrator;
exports.isUserAdministrator = isUserAdministrator;
const discord_js_1 = require("discord.js");
const SNOWFLAKE_REGEX = /^\d{17,20}$/;
function parseUserId(value) {
    const cleaned = value.replace(/[<@!>]/g, "").trim();
    return SNOWFLAKE_REGEX.test(cleaned) ? cleaned : null;
}
async function resolveModerationTarget(interaction, requireMember) {
    const guild = interaction.guild;
    if (!guild) {
        return { error: "Este comando só pode ser usado em um servidor." };
    }
    const userOption = interaction.options.getUser("membro");
    const idOption = interaction.options.getString("id");
    if (!userOption && !idOption) {
        return {
            error: "Informe o usuário pela menção ou pelo ID.",
        };
    }
    const userId = userOption?.id ?? parseUserId(idOption);
    if (!userId) {
        return { error: "ID de usuário inválido." };
    }
    const member = await guild.members.fetch(userId).catch(() => null);
    if (requireMember && !member) {
        return { error: "Este usuário não está no servidor." };
    }
    const tag = userOption?.tag ??
        member?.user.tag ??
        (await interaction.client.users.fetch(userId).catch(() => null))?.tag ??
        userId;
    return { userId, member, tag };
}
function checkModeratorPermissions(interaction, permission) {
    const guild = interaction.guild;
    const member = interaction.member;
    if (!guild || !member || typeof member.permissions === "string") {
        return "Não foi possível verificar suas permissões.";
    }
    if (!member.permissions.has(permission)) {
        return "Você não tem permissão para usar este comando.";
    }
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(permission)) {
        return "Eu não tenho permissão para executar esta ação.";
    }
    return null;
}
function checkModerationHierarchy(interaction, target) {
    const guild = interaction.guild;
    const executor = interaction.member;
    const botMember = guild?.members.me;
    if (!guild || !executor || !botMember || typeof executor.permissions === "string") {
        return "Não foi possível verificar a hierarquia de cargos.";
    }
    const executorId = "id" in executor ? executor.id : executor.user.id;
    if (target.id === executorId) {
        return "Você não pode usar este comando em si mesmo.";
    }
    if (target.id === botMember.id) {
        return "Não posso moderar a mim mesmo.";
    }
    if (target.id === guild.ownerId) {
        return "Não posso moderar o dono do servidor.";
    }
    const executorMember = executor;
    if (target.roles.highest.position >= executorMember.roles.highest.position &&
        executorId !== guild.ownerId) {
        return "Este membro tem cargo igual ou superior ao seu.";
    }
    if (target.roles.highest.position >= botMember.roles.highest.position) {
        return "Este membro tem cargo igual ou superior ao meu.";
    }
    return null;
}
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minuto(s)`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours} hora(s)`;
    }
    return `${hours} hora(s) e ${remainingMinutes} minuto(s)`;
}
exports.ModerationPermissions = {
    ban: discord_js_1.PermissionFlagsBits.BanMembers,
    kick: discord_js_1.PermissionFlagsBits.KickMembers,
    mute: discord_js_1.PermissionFlagsBits.ModerateMembers,
};
async function fetchGuildMember(guild, userId) {
    return guild.members.fetch(userId).catch(() => null);
}
async function fetchExecutorMember(interaction) {
    if (!interaction.guild)
        return null;
    return fetchGuildMember(interaction.guild, interaction.user.id);
}
function isAdministrator(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
}
async function checkAdministrator(interaction) {
    const member = await fetchExecutorMember(interaction);
    if (!member) {
        return "Não foi possível verificar suas permissões.";
    }
    if (!isAdministrator(member)) {
        return "Apenas administradores podem usar este comando.";
    }
    return null;
}
function isUserAdministrator(guild, user) {
    const member = guild.members.cache.get(user.id);
    return member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
}
//# sourceMappingURL=moderation.js.map