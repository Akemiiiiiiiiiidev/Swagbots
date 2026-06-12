"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PD_SELECT_ACESSO = exports.PD_SELECT_CARGO = exports.PD_MODAL_REMOVER = exports.PD_MODAL_SETAR = exports.PD_BTN_REMOVER = exports.PD_BTN_SETAR = exports.PD_BTN_SETUP_ACESSO = exports.PD_BTN_SETUP_CARGO = void 0;
exports.isPdInteraction = isPdInteraction;
exports.buildPdAdminPanel = buildPdAdminPanel;
exports.buildPdUserPanel = buildPdUserPanel;
exports.handlePdButton = handlePdButton;
exports.handlePdRoleSelect = handlePdRoleSelect;
exports.handlePdModal = handlePdModal;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const logs_1 = require("../utils/logs");
const pd_1 = require("../utils/pd");
// ── Custom IDs ────────────────────────────────────────────────────────────────
exports.PD_BTN_SETUP_CARGO = "pd:setup_cargo";
exports.PD_BTN_SETUP_ACESSO = "pd:setup_acesso";
exports.PD_BTN_SETAR = "pd:setar";
exports.PD_BTN_REMOVER = "pd:remover";
exports.PD_MODAL_SETAR = "pd:modal_setar";
exports.PD_MODAL_REMOVER = "pd:modal_remover";
exports.PD_SELECT_CARGO = "pd:select_cargo";
exports.PD_SELECT_ACESSO = "pd:select_acesso";
function isPdInteraction(customId) {
    return customId.startsWith("pd:");
}
// ── Painel para admins (4 botões) ─────────────────────────────────────────────
function buildPdAdminPanel(guildId) {
    const roleId = (0, pd_1.getPdRoleId)(guildId);
    const allowed = (0, pd_1.getPdAllowedRoles)(guildId);
    const holders = (0, pd_1.getAllPdHolders)(guildId);
    const holdersText = holders.length > 0
        ? holders
            .map((h) => `${container_1.E} <@${h.userId}> — setado por <@${h.grantedBy}>`)
            .join("\n")
        : `${container_1.E} Nenhuma PD ativa no momento.`;
    return (0, container_1.buildOrganizedContainer)([
        "# **PRIMEIRA DAMA** — Painel Admin",
        [
            `${container_1.E} **Cargo PD:** ${roleId ? `<@&${roleId}>` : "Não configurado"}`,
            `${container_1.E} **Cargos com acesso (${allowed.length}):** ${allowed.length > 0 ? allowed.map((id) => `<@&${id}>`).join(", ") : "Nenhum"}`,
        ].join("\n"),
        [`${container_1.E} **PDs ativas (${holders.length}):**`, holdersText].join("\n"),
    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_SETUP_CARGO).setLabel("⚙️ Cargo PD").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_SETUP_ACESSO).setLabel("🔑 Cargos de acesso").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_SETAR).setLabel("✅ Setar PD").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_REMOVER).setLabel("❌ Remover PD").setStyle(discord_js_1.ButtonStyle.Danger)));
}
// ── Painel para usuários com acesso (2 botões) ────────────────────────────────
function buildPdUserPanel(guildId, executorId) {
    const count = (0, pd_1.getPdHolderCountByExecutor)(guildId, executorId);
    const holders = (0, pd_1.getPdHoldersByExecutor)(guildId, executorId);
    const holdersText = holders.length > 0
        ? holders.map((h) => `${container_1.E} <@${h.userId}>`).join("\n")
        : `${container_1.E} Voce ainda nao setou nenhuma PD.`;
    return (0, container_1.buildOrganizedContainer)([
        "# **PRIMEIRA DAMA**",
        [
            `${container_1.E} **Suas PDs (${count}/${pd_1.PD_MAX_PER_EXECUTOR}):**`,
            holdersText,
        ].join("\n"),
        `${container_1.E} Voce pode setar o cargo em ate **${pd_1.PD_MAX_PER_EXECUTOR}** pessoas.`,
    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_SETAR).setLabel("✅ Setar PD").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId(exports.PD_BTN_REMOVER).setLabel("❌ Remover PD").setStyle(discord_js_1.ButtonStyle.Danger)));
}
// ── Handler de botões ─────────────────────────────────────────────────────────
async function handlePdButton(interaction) {
    if (!isPdInteraction(interaction.customId))
        return false;
    const guild = interaction.guild;
    if (!guild)
        return true;
    const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
    const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
    const memberRoleIds = executorMember?.roles.cache.map((r) => r.id) ?? [];
    const hasAccess = isAdmin || (0, pd_1.memberHasPdAccess)(guild.id, memberRoleIds);
    // ── Botões exclusivos de admin ────────────────────────────────────────────
    if (interaction.customId === exports.PD_BTN_SETUP_CARGO ||
        interaction.customId === exports.PD_BTN_SETUP_ACESSO) {
        if (!isAdmin) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Apenas administradores podem configurar o sistema PD.`], { ephemeral: true }));
            return true;
        }
        if (interaction.customId === exports.PD_BTN_SETUP_CARGO) {
            await interaction.reply({
                components: [
                    (0, container_1.buildOrganizedContainer)([
                        "# **PRIMEIRA DAMA — Cargo PD**",
                        `${container_1.E} Selecione o cargo que será setado como **Primeira Dama**.`,
                    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.RoleSelectMenuBuilder()
                        .setCustomId(exports.PD_SELECT_CARGO)
                        .setPlaceholder("Selecione o cargo de Primeira Dama")
                        .setMinValues(1)
                        .setMaxValues(1))),
                ],
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
            });
            return true;
        }
        if (interaction.customId === exports.PD_BTN_SETUP_ACESSO) {
            await interaction.reply({
                components: [
                    (0, container_1.buildOrganizedContainer)([
                        "# **PRIMEIRA DAMA — Cargos de Acesso**",
                        `${container_1.E} Selecione os cargos que poderão usar o painel de PD.`,
                        `${container_1.E} A seleção **substitui** os cargos de acesso atuais.`,
                    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.RoleSelectMenuBuilder()
                        .setCustomId(exports.PD_SELECT_ACESSO)
                        .setPlaceholder("Selecione os cargos com acesso")
                        .setMinValues(1)
                        .setMaxValues(10))),
                ],
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
            });
            return true;
        }
    }
    // ── Botões de setar/remover — requer acesso PD ────────────────────────────
    if (!hasAccess) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para usar esta acao.`], { ephemeral: true }));
        return true;
    }
    const roleId = (0, pd_1.getPdRoleId)(guild.id);
    if (!roleId) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo de PD ainda nao foi configurado.`, `${container_1.E} Um administrador precisa configurar primeiro.`], { ephemeral: true }));
        return true;
    }
    if (interaction.customId === exports.PD_BTN_SETAR) {
        // Verifica limite por executor (admins não têm limite)
        if (!isAdmin) {
            const count = (0, pd_1.getPdHolderCountByExecutor)(guild.id, interaction.user.id);
            if (count >= pd_1.PD_MAX_PER_EXECUTOR) {
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    `${container_1.E} Voce ja atingiu o limite de **${pd_1.PD_MAX_PER_EXECUTOR}** PDs.`,
                    `${container_1.E} Remova uma antes de adicionar outra.`,
                ], { ephemeral: true }));
                return true;
            }
        }
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(exports.PD_MODAL_SETAR)
            .setTitle("Setar Primeira Dama")
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID do membro")
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder("Cole o ID do membro aqui")
            .setRequired(true)));
        await interaction.showModal(modal);
        return true;
    }
    if (interaction.customId === exports.PD_BTN_REMOVER) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(exports.PD_MODAL_REMOVER)
            .setTitle("Remover Primeira Dama")
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID do membro")
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder("Cole o ID do membro aqui")
            .setRequired(true)));
        await interaction.showModal(modal);
        return true;
    }
    return false;
}
// ── Handler de RoleSelectMenu ─────────────────────────────────────────────────
async function handlePdRoleSelect(interaction) {
    if (interaction.customId !== exports.PD_SELECT_CARGO &&
        interaction.customId !== exports.PD_SELECT_ACESSO)
        return false;
    const guild = interaction.guild;
    if (!guild)
        return true;
    const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
    const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
    if (!isAdmin) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Apenas administradores podem configurar o sistema PD.`], { ephemeral: true }));
        return true;
    }
    const botMember = guild.members.me;
    if (interaction.customId === exports.PD_SELECT_CARGO) {
        const role = interaction.roles.first();
        if (!role)
            return true;
        if (role.managed) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true }));
            return true;
        }
        if (role.position >= (botMember?.roles.highest.position ?? 0)) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`], { ephemeral: true }));
            return true;
        }
        (0, pd_1.setPdRole)(guild.id, role.id);
        await interaction.update({
            components: [
                (0, container_1.buildOrganizedContainer)([
                    "# **PRIMEIRA DAMA — Cargo PD**",
                    [
                        `${container_1.V} **Cargo configurado com sucesso**`,
                        `${container_1.E} **Cargo PD:** <@&${role.id}>`,
                        `${container_1.E} **Configurado por:** <@${interaction.user.id}>`,
                    ].join("\n"),
                ]),
            ],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        // Deleta o painel de confirmação após 8 segundos
        const msg = await interaction.fetchReply().catch(() => null);
        if (msg)
            setTimeout(() => msg.delete().catch(() => null), 8000);
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.V} **PD — Cargo configurado**`,
                `${container_1.E} **Cargo PD:** <@&${role.id}>`,
                `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
        return true;
    }
    if (interaction.customId === exports.PD_SELECT_ACESSO) {
        const roles = [...interaction.roles.values()];
        (0, pd_1.clearPdAllowedRoles)(guild.id);
        for (const role of roles) {
            (0, pd_1.addPdAllowedRole)(guild.id, role.id);
        }
        await interaction.update({
            components: [
                (0, container_1.buildOrganizedContainer)([
                    "# **PRIMEIRA DAMA — Cargos de Acesso**",
                    [
                        `${container_1.V} **Cargos de acesso atualizados**`,
                        `${container_1.E} **Cargos:** ${roles.map((r) => `<@&${r.id}>`).join(", ")}`,
                        `${container_1.E} **Configurado por:** <@${interaction.user.id}>`,
                    ].join("\n"),
                ]),
            ],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        // Deleta o painel de confirmação após 8 segundos
        const msg = await interaction.fetchReply().catch(() => null);
        if (msg)
            setTimeout(() => msg.delete().catch(() => null), 8000);
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.V} **PD — Cargos de acesso atualizados**`,
                `${container_1.E} **Cargos:** ${roles.map((r) => `<@&${r.id}>`).join(", ")}`,
                `${container_1.E} **Administrador:** <@${interaction.user.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
        return true;
    }
    return false;
}
// ── Handler de Modal ──────────────────────────────────────────────────────────
async function handlePdModal(interaction) {
    if (interaction.customId !== exports.PD_MODAL_SETAR &&
        interaction.customId !== exports.PD_MODAL_REMOVER)
        return false;
    const guild = interaction.guild;
    if (!guild)
        return true;
    const executorMember = await (0, moderation_1.fetchGuildMember)(guild, interaction.user.id);
    const isAdmin = executorMember?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) ?? false;
    const memberRoleIds = executorMember?.roles.cache.map((r) => r.id) ?? [];
    const hasAccess = isAdmin || (0, pd_1.memberHasPdAccess)(guild.id, memberRoleIds);
    if (!hasAccess) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao tem permissao para usar esta acao.`], { ephemeral: true }));
        return true;
    }
    const raw = interaction.fields.getTextInputValue("user_id").trim();
    const userId = raw.replace(/[<@!>]/g, "");
    if (!/^\d{17,20}$/.test(userId)) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} ID invalido. Informe um ID valido.`], { ephemeral: true }));
        return true;
    }
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Membro nao encontrado no servidor.`], { ephemeral: true }));
        return true;
    }
    if (member.user.bot) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao e possivel usar este comando em bots.`], { ephemeral: true }));
        return true;
    }
    const roleId = (0, pd_1.getPdRoleId)(guild.id);
    if (!roleId) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} O cargo de PD nao esta configurado.`], { ephemeral: true }));
        return true;
    }
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true }));
        return true;
    }
    const role = guild.roles.cache.get(roleId);
    if (!role || role.position >= botMember.roles.highest.position) {
        await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Nao consigo gerenciar o cargo PD (hierarquia).`], { ephemeral: true }));
        return true;
    }
    // ── SETAR ─────────────────────────────────────────────────────────────────
    if (interaction.customId === exports.PD_MODAL_SETAR) {
        if ((0, pd_1.isPdHolder)(guild.id, userId)) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> ja possui o cargo PD.`], { ephemeral: true }));
            return true;
        }
        // Limite por executor (admins sem limite)
        if (!isAdmin) {
            const count = (0, pd_1.getPdHolderCountByExecutor)(guild.id, interaction.user.id);
            if (count >= pd_1.PD_MAX_PER_EXECUTOR) {
                await interaction.reply((0, container_1.containerReplyOrganized)([
                    `${container_1.E} Voce ja atingiu o limite de **${pd_1.PD_MAX_PER_EXECUTOR}** PDs.`,
                    `${container_1.E} Remova uma antes de adicionar outra.`,
                ], { ephemeral: true }));
                return true;
            }
        }
        await member.roles.add(roleId, `PD setado por ${interaction.user.tag}`);
        (0, pd_1.addPdHolder)(guild.id, userId, interaction.user.id);
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
        // Deleta a resposta de confirmação após 8 segundos
        const confirmMsg = await interaction.fetchReply().catch(() => null);
        if (confirmMsg)
            setTimeout(() => confirmMsg.delete().catch(() => null), 8000);
        // Deleta o painel original (mensagem do botão) também após 8 segundos
        if (interaction.message) {
            setTimeout(() => interaction.message?.delete().catch(() => null), 8000);
        }
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.V} **PD setado**`,
                `${container_1.E} **Membro:** <@${member.id}>`,
                `${container_1.E} **Cargo:** <@&${roleId}>`,
                `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
        return true;
    }
    // ── REMOVER ───────────────────────────────────────────────────────────────
    if (interaction.customId === exports.PD_MODAL_REMOVER) {
        if (!(0, pd_1.isPdHolder)(guild.id, userId)) {
            await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} <@${member.id}> nao possui o cargo PD.`], { ephemeral: true }));
            return true;
        }
        // Não-admins só podem remover quem eles mesmos setaram
        if (!isAdmin) {
            const grantedBy = (0, pd_1.getPdHolderGrantedBy)(guild.id, userId);
            if (grantedBy !== interaction.user.id) {
                await interaction.reply((0, container_1.containerReplyOrganized)([`${container_1.E} Voce nao pode remover esta PD — foi setada por outro membro.`], { ephemeral: true }));
                return true;
            }
        }
        await member.roles.remove(roleId, `PD removido por ${interaction.user.tag}`);
        (0, pd_1.removePdHolder)(guild.id, userId);
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
        // Deleta a resposta de confirmação após 8 segundos
        const confirmMsg = await interaction.fetchReply().catch(() => null);
        if (confirmMsg)
            setTimeout(() => confirmMsg.delete().catch(() => null), 8000);
        // Deleta o painel original (mensagem do botão) também após 8 segundos
        if (interaction.message) {
            setTimeout(() => interaction.message?.delete().catch(() => null), 8000);
        }
        await (0, logs_1.sendLog)(guild, "cargo", [
            [
                `${container_1.V} **PD removido**`,
                `${container_1.E} **Membro:** <@${member.id}>`,
                `${container_1.E} **Cargo:** <@&${roleId}>`,
                `${container_1.E} **Executor:** <@${interaction.user.id}>`,
                `${container_1.E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        ]);
        return true;
    }
    return false;
}
//# sourceMappingURL=pdInteractions.js.map