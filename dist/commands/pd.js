"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pd = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const logs_1 = require("../utils/logs");
const pd_1 = require("../utils/pd");
exports.pd = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("pd")
        .setDescription("Sistema de Primeira Dama")
        .addSubcommand((sub) => sub
        .setName("setup")
        .setDescription("Configura o cargo e os usuarios com acesso ao /pd")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo que sera setado como Primeira Dama").setRequired(true))
        .addUserOption((opt) => opt.setName("usuario1").setDescription("Usuario que podera usar o /pd").setRequired(true))
        .addUserOption((opt) => opt.setName("usuario2").setDescription("Usuario que podera usar o /pd").setRequired(false))
        .addUserOption((opt) => opt.setName("usuario3").setDescription("Usuario que podera usar o /pd").setRequired(false))
        .addUserOption((opt) => opt.setName("usuario4").setDescription("Usuario que podera usar o /pd").setRequired(false))
        .addUserOption((opt) => opt.setName("usuario5").setDescription("Usuario que podera usar o /pd").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("setar")
        .setDescription("Seta o cargo de Primeira Dama em um membro")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro que recebera o cargo").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("remover")
        .setDescription("Remove o cargo de Primeira Dama de um membro")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro que perdera o cargo").setRequired(true)))
        .addSubcommand((sub) => sub.setName("ver").setDescription("Mostra a configuracao atual do sistema PD")),
    async execute(interaction) {
        (0, pd_1.initPd)();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este comando so pode ser usado em um servidor.`], { ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        // ── SETUP ─────────────────────────────────────────────────────────────────
        if (sub === "setup") {
            const adminError = await (0, moderation_1.checkAdministrator)(interaction);
            if (adminError) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ${adminError}`], { ephemeral: true }));
                return;
            }
            const role = interaction.options.getRole("cargo", true);
            if (role.managed) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
                return;
            }
            const botMember = guild.members.me;
            if (role.position >= (botMember?.roles.highest.position ?? 0)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`], { ephemeral: true }));
                return;
            }
            (0, pd_1.setPdRole)(guild.id, role.id);
            // Coleta usuarios das opcoes
            const userOptions = ["usuario1", "usuario2", "usuario3", "usuario4", "usuario5"];
            const addedUsers = [];
            for (const optName of userOptions) {
                const user = interaction.options.getUser(optName);
                if (!user || user.bot)
                    continue;
                (0, pd_1.addPdAllowedUser)(guild.id, user.id);
                addedUsers.push(user.id);
            }
            const allAllowed = (0, pd_1.getPdAllowedUsers)(guild.id);
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **PRIMEIRA DAMA**",
                [
                    `${container_1.V} **Configuracao salva**`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                ].join("\n"),
                [
                    `${container_1.E} **Usuarios com acesso ao /pd (${allAllowed.length}):**`,
                    allAllowed.length > 0
                        ? allAllowed.map((id) => `${container_1.E} <@${id}>`).join("\n")
                        : `${container_1.E} Nenhum usuario configurado.`,
                ].join("\n"),
            ]));
            await (0, logs_1.sendLog)(guild, "cargo", [
                [
                    `${container_1.V} **PD configurado**`,
                    `${container_1.E} **Cargo:** <@&${role.id}>`,
                    `${container_1.E} **Usuarios adicionados:** ${addedUsers.map((id) => `<@${id}>`).join(", ") || "nenhum"}`,
                    `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                    `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join("\n"),
            ]);
            return;
        }
        // ── VER ───────────────────────────────────────────────────────────────────
        if (sub === "ver") {
            const roleId = (0, pd_1.getPdRoleId)(guild.id);
            const allowed = (0, pd_1.getPdAllowedUsers)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nenhuma configuracao de PD encontrada.`, `${container_1.E} Use \`/pd setup\` para configurar.`], { ephemeral: true }));
                return;
            }
            await interaction.reply((0, container_1.containerReplyOrganized)([
                "# **PRIMEIRA DAMA**",
                [
                    `${container_1.V} **Configuracao atual**`,
                    `${container_1.E} **Cargo:** <@&${roleId}>`,
                ].join("\n"),
                [
                    `${container_1.E} **Usuarios com acesso (${allowed.length}):**`,
                    allowed.length > 0
                        ? allowed.map((id) => `${container_1.E} <@${id}>`).join("\n")
                        : `${container_1.E} Nenhum usuario configurado.`,
                ].join("\n"),
            ]));
            return;
        }
        // ── SETAR / REMOVER ───────────────────────────────────────────────────────
        if (sub === "setar" || sub === "remover") {
            // Verifica se o executor tem permissao de PD ou e administrador
            const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
            const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
            const hasAccess = isAdmin || (0, pd_1.isPdAllowedUser)(guild.id, interaction.user.id);
            if (!hasAccess) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para usar este comando.`], { ephemeral: true }));
                return;
            }
            const roleId = (0, pd_1.getPdRoleId)(guild.id);
            if (!roleId) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo de PD ainda nao foi configurado.`, `${container_1.E} Um administrador precisa usar \`/pd setup\` primeiro.`], { ephemeral: true }));
                return;
            }
            const targetUser = interaction.options.getUser("membro", true);
            if (targetUser.bot) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar este comando em bots.`], { ephemeral: true }));
                return;
            }
            const member = await (0, moderation_1.fetchGuildMember)(guild, targetUser.id);
            if (!member) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Este membro nao esta no servidor.`], { ephemeral: true }));
                return;
            }
            const botMember = guild.members.me;
            if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true }));
                return;
            }
            const role = guild.roles.cache.get(roleId);
            if (!role) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo configurado nao existe mais. Use \`/pd setup\` para reconfigurar.`], { ephemeral: true }));
                return;
            }
            if (role.position >= botMember.roles.highest.position) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`], { ephemeral: true }));
                return;
            }
            if (sub === "setar") {
                if (member.roles.cache.has(roleId)) {
                    await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> ja possui o cargo <@&${roleId}>.`], { ephemeral: true }));
                    return;
                }
                await member.roles.add(roleId, `PD setado por ${interaction.user.tag}`);
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    "# **PRIMEIRA DAMA**",
                    [
                        `${container_1.V} **Cargo setado**`,
                        `${container_1.E} **Membro:** <@${member.id}>`,
                        `${container_1.E} **Cargo:** <@&${roleId}>`,
                        `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                        `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ].join("\n"),
                ]));
                await (0, logs_1.sendLog)(guild, "cargo", [
                    [
                        `${container_1.V} **PD setado**`,
                        `${container_1.E} **Membro:** <@${member.id}>`,
                        `${container_1.E} **Cargo:** <@&${roleId}>`,
                        `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                        `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ].join("\n"),
                ]);
                return;
            }
            if (sub === "remover") {
                if (!member.roles.cache.has(roleId)) {
                    await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> nao possui o cargo <@&${roleId}>.`], { ephemeral: true }));
                    return;
                }
                await member.roles.remove(roleId, `PD removido por ${interaction.user.tag}`);
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    "# **PRIMEIRA DAMA**",
                    [
                        `${container_1.V} **Cargo removido**`,
                        `${container_1.E} **Membro:** <@${member.id}>`,
                        `${container_1.E} **Cargo:** <@&${roleId}>`,
                        `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                        `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ].join("\n"),
                ]));
                await (0, logs_1.sendLog)(guild, "cargo", [
                    [
                        `${container_1.V} **PD removido**`,
                        `${container_1.E} **Membro:** <@${member.id}>`,
                        `${container_1.E} **Cargo:** <@&${roleId}>`,
                        `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                        `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ].join("\n"),
                ]);
            }
        }
    },
};
//# sourceMappingURL=pd.js.map