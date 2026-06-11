"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletartudo = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const logs_1 = require("../utils/logs");
async function deleteAllChannels(guild, reason) {
    let deleted = 0;
    let failed = 0;
    await guild.channels.fetch();
    for (let pass = 0; pass < 3; pass++) {
        const channels = [...guild.channels.cache.values()].filter((channel) => channel.type !== discord_js_1.ChannelType.GuildCategory);
        if (channels.length === 0)
            break;
        for (const channel of channels) {
            try {
                await channel.delete(reason);
                deleted++;
            }
            catch {
                failed++;
            }
        }
        await guild.channels.fetch();
    }
    const categories = [...guild.channels.cache.values()]
        .filter((channel) => channel.type === discord_js_1.ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);
    for (const category of categories) {
        try {
            await category.delete(reason);
            deleted++;
        }
        catch {
            failed++;
        }
    }
    return { deleted, failed };
}
exports.deletartudo = {
    defer: true,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("deletartudo")
        .setDescription("Deleta todos os canais e cargos do servidor"),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply((0, container_1.containerReply)("Este comando só pode ser usado em um servidor.", {
                    ephemeral: true,
                }));
            }
            return;
        }
        let executorMember;
        try {
            executorMember = await guild.members.fetch(interaction.user.id);
        }
        catch {
            await interaction.editReply((0, container_1.containerEdit)("Não foi possível verificar suas permissões."));
            return;
        }
        const botMember = guild.members.me;
        if (!executorMember.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels) ||
            !executorMember.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply((0, container_1.containerEdit)("Você precisa das permissões Gerenciar canais e Gerenciar cargos."));
            return;
        }
        if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels) ||
            !botMember.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply((0, container_1.containerEdit)("Eu preciso das permissões Gerenciar canais e Gerenciar cargos."));
            return;
        }
        try {
            const reason = `${interaction.user.tag}: limpeza total do servidor`;
            const isOwner = executorMember.id === guild.ownerId;
            const channels = await deleteAllChannels(guild, reason);
            await guild.roles.fetch();
            let rolesDeleted = 0;
            let rolesSkipped = 0;
            const roles = [...guild.roles.cache.values()]
                .filter((role) => role.id !== guild.id)
                .sort((a, b) => a.position - b.position);
            for (const role of roles) {
                if (role.managed) {
                    rolesSkipped++;
                    continue;
                }
                if (role.position >= botMember.roles.highest.position) {
                    rolesSkipped++;
                    continue;
                }
                if (!isOwner &&
                    role.position >= executorMember.roles.highest.position) {
                    rolesSkipped++;
                    continue;
                }
                try {
                    await role.delete(reason);
                    rolesDeleted++;
                }
                catch {
                    rolesSkipped++;
                }
            }
            await interaction.editReply((0, container_1.containerEdit)([
                "**Limpeza concluída**",
                `**Canais deletados:** ${channels.deleted}`,
                `**Canais com falha:** ${channels.failed}`,
                `**Cargos deletados:** ${rolesDeleted}`,
                `**Cargos ignorados:** ${rolesSkipped}`,
                `**Moderador:** ${interaction.user.tag}`,
            ].join("\n")));
            await (0, logs_1.sendLog)(guild, "call", [
                [
                    "**Limpeza de canais**",
                    `**Canais deletados:** ${channels.deleted}`,
                    `**Canais com falha:** ${channels.failed}`,
                    `**Moderador:** <@${interaction.user.id}>`,
                    `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
            await (0, logs_1.sendLog)(guild, "cargo", [
                [
                    "**Limpeza de cargos**",
                    `**Cargos deletados:** ${rolesDeleted}`,
                    `**Cargos ignorados:** ${rolesSkipped}`,
                    `**Moderador:** <@${interaction.user.id}>`,
                    `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
        }
        catch (error) {
            console.error("Erro em /deletartudo:", error);
            try {
                await interaction.editReply((0, container_1.containerEdit)("Ocorreu um erro durante a limpeza. Verifique se o bot tem permissões suficientes."));
            }
            catch {
                // Interação já expirou ou foi respondida
            }
        }
    },
};
//# sourceMappingURL=deletartudo.js.map