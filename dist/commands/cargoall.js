"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cargoall = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const logs_1 = require("../utils/logs");
// Aguarda ms entre batches para evitar rate limit
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
exports.cargoall = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cargo-all")
        .setDescription("Adiciona ou remove um cargo de todos os membros do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("Adiciona um cargo a todos os membros")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo a adicionar").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remover")
        .setDescription("Remove um cargo de todos os membros")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo a remover").setRequired(true))),
    defer: true,
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`]));
            return;
        }
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} ${adminError}`]));
            return;
        }
        const botMember = guild.members.me;
        if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Nao tenho permissao para gerenciar cargos.`]));
            return;
        }
        const role = interaction.options.getRole("cargo", true);
        const sub = interaction.options.getSubcommand();
        if (role.managed) {
            await interaction.editReply((0, container_1.containerEditOrganized)([`${container_1.E} Nao e possivel gerenciar cargos de integracao.`]));
            return;
        }
        if (role.position >= botMember.roles.highest.position) {
            await interaction.editReply((0, container_1.containerEditOrganized)([
                `${container_1.E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`,
            ]));
            return;
        }
        // Busca todos os membros
        await guild.members.fetch();
        const allMembers = guild.members.cache.filter((m) => !m.user.bot);
        const total = allMembers.size;
        await interaction.editReply((0, container_1.containerEditOrganized)([
            `# **CARGO ALL**`,
            `${container_1.E} Processando **${total}** membros... aguarde.`,
        ]));
        let success = 0;
        let skipped = 0;
        let failed = 0;
        const BATCH = 10;
        const members = [...allMembers.values()];
        for (let i = 0; i < members.length; i += BATCH) {
            const batch = members.slice(i, i + BATCH);
            await Promise.allSettled(batch.map(async (member) => {
                try {
                    if (sub === "add") {
                        if (member.roles.cache.has(role.id)) {
                            skipped++;
                            return;
                        }
                        await member.roles.add(role.id, `Cargo-all por ${interaction.user.tag}`);
                    }
                    else {
                        if (!member.roles.cache.has(role.id)) {
                            skipped++;
                            return;
                        }
                        await member.roles.remove(role.id, `Cargo-all por ${interaction.user.tag}`);
                    }
                    success++;
                }
                catch {
                    failed++;
                }
            }));
            // Pequena pausa a cada batch para respeitar rate limit
            if (i + BATCH < members.length) {
                await wait(1000);
            }
        }
        const action = sub === "add" ? "adicionado" : "removido";
        await interaction.editReply((0, container_1.containerEditOrganized)([
            `# **CARGO ALL**`,
            [
                `${container_1.V} **Cargo ${action}:** <@&${role.id}>`,
                `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                `${container_1.E} **Total de membros:** ${total}`,
                `${container_1.V} **Sucesso:** ${success}`,
                `${container_1.E} **Ja tinham/sem cargo:** ${skipped}`,
                failed > 0 ? `${container_1.E} **Falhas:** ${failed}` : "",
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ]
                .filter(Boolean)
                .join("\n"),
        ]));
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.V} **Cargo-all executado**`,
                `${container_1.E} **Acao:** ${sub === "add" ? "Adicionar" : "Remover"} cargo de todos`,
                `${container_1.E} **Cargo:** <@&${role.id}>`,
                `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                `${container_1.E} **Sucesso:** ${success} | **Pulados:** ${skipped} | **Falhas:** ${failed}`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
    },
};
//# sourceMappingURL=cargoall.js.map