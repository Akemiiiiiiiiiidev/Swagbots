"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiban = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const antiban_1 = require("../utils/antiban");
exports.antiban = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("antiban")
        .setDescription("Configura o cargo de protecao contra banimento")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub
        .setName("setup")
        .setDescription("Define o cargo antiban")
        .addRoleOption((opt) => opt
        .setName("cargo")
        .setDescription("Cargo que protege contra banimento")
        .setRequired(true)))
        .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra o cargo antiban configurado"))
        .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao do antiban")),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        // ── VER ──────────────────────────────────────────────────────────────────
        if (sub === "ver") {
            const roleId = (0, antiban_1.getAntibanRoleId)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    "# **ANTIBAN**",
                    `${container_1.E} Nenhum cargo antiban configurado.`,
                    `${container_1.E} Use /antiban setup para definir um cargo.`,
                ], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **ANTIBAN**",
                [
                    `${container_1.V} **Cargo configurado**`,
                    `${container_1.E} **Cargo:** <@&${roleId}>`,
                    `${container_1.E} Membros com este cargo nao podem ser banidos pelo bot.`,
                ].join("\n"),
            ]));
            return;
        }
        // ── SETUP ─────────────────────────────────────────────────────────────────
        if (sub === "setup") {
            const role = interaction.options.getRole("cargo", true);
            if (role.managed) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
                return;
            }
            (0, antiban_1.setAntiban)(guild.id, role.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **ANTIBAN**",
                [
                    `${container_1.V} **Cargo configurado**`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Membros com este cargo nao poderao ser banidos pelo bot.`,
            ]));
            return;
        }
        // ── REMOVER ───────────────────────────────────────────────────────────────
        if (sub === "remover") {
            const roleId = (0, antiban_1.getAntibanRoleId)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nenhum cargo antiban configurado.`], { ephemeral: true }));
                return;
            }
            (0, antiban_1.clearAntiban)(guild.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **ANTIBAN**",
                [
                    `${container_1.V} **Configuracao removida**`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} O sistema de antiban foi desativado.`,
            ]));
        }
    },
};
//# sourceMappingURL=antiban.js.map