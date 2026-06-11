"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cargo = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const roleProtection_1 = require("../utils/roleProtection");
exports.cargo = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cargo")
        .setDescription("Configuracoes de protecao de cargos")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub.setName("setup").setDescription("Ativa ou desativa a protecao de cargos")
        .addBooleanOption((opt) => opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true))),
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
        const ativar = interaction.options.getBoolean("ativar", true);
        const current = (0, roleProtection_1.isRoleProtectionEnabled)(guild.id);
        if (ativar === current) {
            await interaction.reply((0, container_1.containerReplyOrganized)(["# **PROTECAO DE CARGOS**", `${container_1.E} A protecao ja esta **${current ? "ativada" : "desativada"}**.`], { ephemeral: true }));
            return;
        }
        (0, roleProtection_1.setRoleProtection)(guild.id, ativar);
        await interaction.reply((0, container_1.containerReplyOrganized)([
            "# **PROTECAO DE CARGOS**",
            [
                `${container_1.V} **Status:** ${ativar ? "Ativada" : "Desativada"}`,
                `${container_1.E} **Configurado por:** <@${interaction.user.id}>`,
                "",
                ativar
                    ? `${container_1.E} Apenas administradores podem alterar ou deletar cargos.\n${container_1.E} Infratores terao todos os seus cargos removidos automaticamente.`
                    : `${container_1.E} A protecao foi desativada. Qualquer membro com permissao pode alterar cargos.`,
            ].join("\n"),
        ], { ephemeral: true }));
    },
};
//# sourceMappingURL=cargo.js.map