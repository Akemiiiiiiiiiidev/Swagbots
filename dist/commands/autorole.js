"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autorole = void 0;
const discord_js_1 = require("discord.js");
const autoRole_1 = require("../utils/autoRole");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
exports.autorole = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("autorole")
        .setDescription("Configura o cargo automatico ao entrar no servidor")
        .addSubcommand((sub) => sub
        .setName("setup")
        .setDescription("Define o cargo automatico")
        .addRoleOption((option) => option.setName("cargo").setDescription("Cargo para novos membros").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("aplicar")
        .setDescription("Aplica o cargo automatico em um membro")
        .addUserOption((option) => option.setName("membro").setDescription("Membro para receber o cargo").setRequired(true)))
        .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra o cargo automatico configurado"))
        .addSubcommand((sub) => sub.setName("remover").setDescription("Remove a configuracao do cargo automatico")),
    async execute(interaction) {
        (0, autoRole_1.initAutoRole)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "ver") {
            const roleId = (0, autoRole_1.getAutoRoleId)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nenhum cargo automatico configurado.`, `${container_1.E} Use /autorole setup para definir um cargo.`], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **AUTOROLE**",
                [`${container_1.V} **Cargo configurado**`, `${container_1.E} **Cargo:** <@&${roleId}>`].join("\n"),
            ]));
            return;
        }
        const adminError = await (0, moderation_1.checkAdministrator)(interaction);
        if (adminError) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
            return;
        }
        if (subcommand === "setup") {
            const role = interaction.options.getRole("cargo", true);
            if (role.managed) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
                return;
            }
            (0, autoRole_1.setAutoRole)(guild.id, role.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **AUTOROLE**",
                [
                    `${container_1.V} **Cargo configurado**`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Novos membros receberao este cargo ao entrar no servidor.`,
            ]));
            return;
        }
        if (subcommand === "remover") {
            (0, autoRole_1.clearAutoRole)(guild.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **AUTOROLE**",
                [
                    `${container_1.V} **Configuracao removida**`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                `${container_1.E} Novos membros nao receberao mais cargo automatico.`,
            ]));
            return;
        }
        if (subcommand === "aplicar") {
            const roleId = (0, autoRole_1.getAutoRoleId)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nenhum cargo automatico configurado.`, `${container_1.E} Use /autorole setup antes de aplicar manualmente.`], { ephemeral: true }));
                return;
            }
            const targetUser = interaction.options.getUser("membro", true);
            const member = await (0, moderation_1.fetchGuildMember)(guild, targetUser.id);
            if (!member) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este membro nao esta no servidor.`], { ephemeral: true }));
                return;
            }
            const result = await (0, autoRole_1.assignAutoRole)(member);
            if (!result.success) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${result.error}`], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **AUTOROLE**",
                [
                    `${container_1.V} **Cargo aplicado**`,
                    `${container_1.E} **Membro:** <@${member.id}>`,
                    `${container_1.E} **Cargo:** <@&${result.role.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
            ]));
        }
    },
};
//# sourceMappingURL=autorole.js.map