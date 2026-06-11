"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setarcargo = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const logs_1 = require("../utils/logs");
const setarCargo_1 = require("../utils/setarCargo");
exports.setarcargo = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setar-cargo")
        .setDescription("Gerencia cargos de membros via bot")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
        .addSubcommand((sub) => sub
        .setName("add")
        .setDescription("Adiciona um cargo a um membro")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro que recebera o cargo").setRequired(true))
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo a adicionar").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remover")
        .setDescription("Remove um cargo de um membro")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro que perdera o cargo").setRequired(true))
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo a remover").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("protecao")
        .setDescription("Ativa ou desativa a protecao contra cargos manuais")
        .addBooleanOption((opt) => opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true))),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        // ── PROTECAO ──────────────────────────────────────────────────────────────
        if (sub === "protecao") {
            const adminError = await (0, moderation_1.checkAdministrator)(interaction);
            if (adminError) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
                return;
            }
            const ativar = interaction.options.getBoolean("ativar", true);
            const current = (0, setarCargo_1.isSetarCargoProtectionEnabled)(guild.id);
            if (ativar === current) {
                await interaction.reply((0, container_1.containerReplyOrganized)(["# **SETAR CARGO**", `${container_1.E} A protecao ja esta **${current ? "ativada" : "desativada"}**.`], { ephemeral: true }));
                return;
            }
            (0, setarCargo_1.setSetarCargoProtection)(guild.id, ativar);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **SETAR CARGO**",
                [
                    `${container_1.V} **Protecao:** ${ativar ? "Ativada" : "Desativada"}`,
                    `${container_1.E} **Configurado por:** <@${interaction.user.id}>`,
                    "",
                    ativar
                        ? `${container_1.E} Apenas o bot pode adicionar ou remover cargos.\n${container_1.E} Qualquer tentativa manual sera revertida automaticamente.`
                        : `${container_1.E} Protecao desativada. Membros podem alterar cargos normalmente.`,
                ].join("\n"),
            ]));
            return;
        }
        // ── ADD / REMOVER ─────────────────────────────────────────────────────────
        const botMember = guild.members.me;
        if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true }));
            return;
        }
        const targetUser = interaction.options.getUser("membro", true);
        const role = interaction.options.getRole("cargo", true);
        const member = await (0, moderation_1.fetchGuildMember)(guild, targetUser.id);
        if (!member) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este membro nao esta no servidor.`], { ephemeral: true }));
            return;
        }
        if (role.managed) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel gerenciar cargos de integracao.`], { ephemeral: true }));
            return;
        }
        // Verifica hierarquia do bot
        if (role.position >= botMember.roles.highest.position) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`], { ephemeral: true }));
            return;
        }
        if (sub === "add") {
            if (member.roles.cache.has(role.id)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> ja possui o cargo <@&${role.id}>.`], { ephemeral: true }));
                return;
            }
            await member.roles.add(role.id, `Setar cargo por ${interaction.user.tag}`);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **SETAR CARGO**",
                [
                    `${container_1.V} **Cargo adicionado**`,
                    `${container_1.E} **Membro:** <@${member.id}>`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]));
            await (0, logs_1.sendLog)(guild, "cargo", [
                [
                    `${container_1.V} **Cargo adicionado via comando**`,
                    `${container_1.E} **Membro:** <@${member.id}>`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
            return;
        }
        if (sub === "remover") {
            if (!member.roles.cache.has(role.id)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> nao possui o cargo <@&${role.id}>.`], { ephemeral: true }));
                return;
            }
            await member.roles.remove(role.id, `Remover cargo por ${interaction.user.tag}`);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **SETAR CARGO**",
                [
                    `${container_1.V} **Cargo removido**`,
                    `${container_1.E} **Membro:** <@${member.id}>`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]));
            await (0, logs_1.sendLog)(guild, "cargo", [
                [
                    `${container_1.V} **Cargo removido via comando**`,
                    `${container_1.E} **Membro:** <@${member.id}>`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
        }
    },
};
//# sourceMappingURL=setarcargo.js.map