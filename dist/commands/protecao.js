"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protecao = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const protection_1 = require("../utils/protection");
exports.protecao = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("protecao")
        .setDescription("Gerencia os sistemas de protecao do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addSubcommand((sub) => sub
        .setName("anti-link")
        .setDescription("Ativa ou desativa o bloqueio automatico de links")
        .addBooleanOption((opt) => opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("canais")
        .setDescription("Ativa ou desativa a protecao de canais, calls e categorias")
        .addBooleanOption((opt) => opt.setName("ativar").setDescription("true para ativar, false para desativar").setRequired(true)))
        .addSubcommand((sub) => sub.setName("status").setDescription("Mostra o status atual de todos os sistemas")),
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
        // ── STATUS ────────────────────────────────────────────────────────────────
        if (sub === "status") {
            const antiLink = (0, protection_1.isProtectionEnabled)(guild.id, "anti_link");
            const channelProt = (0, protection_1.isProtectionEnabled)(guild.id, "channel_protection");
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **PROTECAO**",
                [
                    `${antiLink ? container_1.V : container_1.E} **Anti-link:** ${antiLink ? "Ativado" : "Desativado"}`,
                    `${channelProt ? container_1.V : container_1.E} **Canais/Calls/Categorias:** ${channelProt ? "Ativado" : "Desativado"}`,
                ].join("\n"),
                `${container_1.E} Use os subcomandos para ativar ou desativar cada sistema.`,
            ]));
            return;
        }
        // ── ANTI-LINK ─────────────────────────────────────────────────────────────
        if (sub === "anti-link") {
            const ativar = interaction.options.getBoolean("ativar", true);
            const current = (0, protection_1.isProtectionEnabled)(guild.id, "anti_link");
            if (ativar === current) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O anti-link ja esta **${current ? "ativado" : "desativado"}**.`], { ephemeral: true }));
                return;
            }
            (0, protection_1.setProtection)(guild.id, "anti_link", ativar);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **PROTECAO — Anti-link**",
                [
                    `${ativar ? container_1.V : container_1.E} **Status:** ${ativar ? "Ativado" : "Desativado"}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    "",
                    ativar
                        ? `${container_1.E} Links enviados por nao-admins serao deletados automaticamente.`
                        : `${container_1.E} Links poderao ser enviados livremente.`,
                ].join("\n"),
            ]));
            return;
        }
        // ── CANAIS ────────────────────────────────────────────────────────────────
        if (sub === "canais") {
            const ativar = interaction.options.getBoolean("ativar", true);
            const current = (0, protection_1.isProtectionEnabled)(guild.id, "channel_protection");
            if (ativar === current) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} A protecao de canais ja esta **${current ? "ativada" : "desativada"}**.`], { ephemeral: true }));
                return;
            }
            (0, protection_1.setProtection)(guild.id, "channel_protection", ativar);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **PROTECAO — Canais/Calls/Categorias**",
                [
                    `${ativar ? container_1.V : container_1.E} **Status:** ${ativar ? "Ativada" : "Desativada"}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    "",
                    ativar
                        ? `${container_1.E} Canais, calls e categorias deletados ou movidos por nao-admins serao revertidos e o executor punido.`
                        : `${container_1.E} Protecao desativada. Qualquer membro pode alterar canais conforme suas permissoes.`,
                ].join("\n"),
            ]));
            return;
        }
    },
};
//# sourceMappingURL=protecao.js.map