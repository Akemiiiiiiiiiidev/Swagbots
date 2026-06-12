import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buildOrganizedContainer, containerReplyOrganized, E, V } from "../utils/container";
import { fetchGuildMember } from "../utils/moderation";
import { sendLog } from "../utils/logs";
import {
  addPdAllowedRole,
  addPdHolder,
  clearPdAllowedRoles,
  getAllPdHolders,
  getPdAllowedRoles,
  getPdHolderCountByExecutor,
  getPdHolderGrantedBy,
  getPdHoldersByExecutor,
  getPdRoleId,
  isPdHolder,
  memberHasPdAccess,
  PD_MAX_PER_EXECUTOR,
  removePdHolder,
  setPdRole,
} from "../utils/pd";

// ── Custom IDs ────────────────────────────────────────────────────────────────
export const PD_BTN_SETUP_CARGO  = "pd:setup_cargo";
export const PD_BTN_SETUP_ACESSO = "pd:setup_acesso";
export const PD_BTN_SETAR        = "pd:setar";
export const PD_BTN_REMOVER      = "pd:remover";
export const PD_MODAL_SETAR      = "pd:modal_setar";
export const PD_MODAL_REMOVER    = "pd:modal_remover";
export const PD_SELECT_CARGO     = "pd:select_cargo";
export const PD_SELECT_ACESSO    = "pd:select_acesso";

export function isPdInteraction(customId: string): boolean {
  return customId.startsWith("pd:");
}

// ── Painel para admins (4 botões) ─────────────────────────────────────────────
export function buildPdAdminPanel(guildId: string) {
  const roleId  = getPdRoleId(guildId);
  const allowed = getPdAllowedRoles(guildId);
  const holders = getAllPdHolders(guildId);

  const holdersText =
    holders.length > 0
      ? holders
          .map((h) => `${E} <@${h.userId}> — setado por <@${h.grantedBy}>`)
          .join("\n")
      : `${E} Nenhuma PD ativa no momento.`;

  return buildOrganizedContainer([
    "# **PRIMEIRA DAMA** — Painel Admin",
    [
      `${E} **Cargo PD:** ${roleId ? `<@&${roleId}>` : "Não configurado"}`,
      `${E} **Cargos com acesso (${allowed.length}):** ${
        allowed.length > 0 ? allowed.map((id) => `<@&${id}>`).join(", ") : "Nenhum"
      }`,
    ].join("\n"),
    [`${E} **PDs ativas (${holders.length}):**`, holdersText].join("\n"),
  ]).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(PD_BTN_SETUP_CARGO).setLabel("⚙️ Cargo PD").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(PD_BTN_SETUP_ACESSO).setLabel("🔑 Cargos de acesso").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(PD_BTN_SETAR).setLabel("Setar PD").setEmoji("1514793590394585108").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(PD_BTN_REMOVER).setLabel("Remover PD").setEmoji("1514793575248953386").setStyle(ButtonStyle.Secondary),
    )
  );
}

// ── Painel para usuários com acesso (2 botões) ────────────────────────────────
export function buildPdUserPanel(guildId: string, executorId: string) {
  const count   = getPdHolderCountByExecutor(guildId, executorId);
  const holders = getPdHoldersByExecutor(guildId, executorId);

  const holdersText =
    holders.length > 0
      ? holders.map((h) => `${E} <@${h.userId}>`).join("\n")
      : `${E} Voce ainda nao setou nenhuma PD.`;

  return buildOrganizedContainer([
    "# **PRIMEIRA DAMA**",
    [
      `${E} **Suas PDs (${count}/${PD_MAX_PER_EXECUTOR}):**`,
      holdersText,
    ].join("\n"),
    `${E} Voce pode setar o cargo em ate **${PD_MAX_PER_EXECUTOR}** pessoas.`,
  ]).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(PD_BTN_SETAR).setLabel("Setar PD").setEmoji("1514793590394585108").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(PD_BTN_REMOVER).setLabel("Remover PD").setEmoji("1514793575248953386").setStyle(ButtonStyle.Secondary),
    )
  );
}

// ── Handler de botões ─────────────────────────────────────────────────────────
export async function handlePdButton(interaction: ButtonInteraction): Promise<boolean> {
  if (!isPdInteraction(interaction.customId)) return false;

  const guild = interaction.guild;
  if (!guild) return true;

  const executorMember = await fetchGuildMember(guild, interaction.user.id);
  const isAdmin        = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
  const memberRoleIds  = executorMember?.roles.cache.map((r) => r.id) ?? [];
  const hasAccess      = isAdmin || memberHasPdAccess(guild.id, memberRoleIds);

  // ── Botões exclusivos de admin ────────────────────────────────────────────
  if (
    interaction.customId === PD_BTN_SETUP_CARGO ||
    interaction.customId === PD_BTN_SETUP_ACESSO
  ) {
    if (!isAdmin) {
      await interaction.reply(
        containerReplyOrganized([`${E} Apenas administradores podem configurar o sistema PD.`], { ephemeral: true })
      );
      return true;
    }

    if (interaction.customId === PD_BTN_SETUP_CARGO) {
      await interaction.reply({
        components: [
          buildOrganizedContainer([
            "# **PRIMEIRA DAMA — Cargo PD**",
            `${E} Selecione o cargo que será setado como **Primeira Dama**.`,
          ]).addActionRowComponents(
            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId(PD_SELECT_CARGO)
                .setPlaceholder("Selecione o cargo de Primeira Dama")
                .setMinValues(1)
                .setMaxValues(1)
            )
          ),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return true;
    }

    if (interaction.customId === PD_BTN_SETUP_ACESSO) {
      await interaction.reply({
        components: [
          buildOrganizedContainer([
            "# **PRIMEIRA DAMA — Cargos de Acesso**",
            `${E} Selecione os cargos que poderão usar o painel de PD.`,
            `${E} A seleção **substitui** os cargos de acesso atuais.`,
          ]).addActionRowComponents(
            new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId(PD_SELECT_ACESSO)
                .setPlaceholder("Selecione os cargos com acesso")
                .setMinValues(1)
                .setMaxValues(10)
            )
          ),
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
      return true;
    }
  }

  // ── Botões de setar/remover — requer acesso PD ────────────────────────────
  if (!hasAccess) {
    await interaction.reply(
      containerReplyOrganized([`${E} Voce nao tem permissao para usar esta acao.`], { ephemeral: true })
    );
    return true;
  }

  const roleId = getPdRoleId(guild.id);
  if (!roleId) {
    await interaction.reply(
      containerReplyOrganized(
        [`${E} O cargo de PD ainda nao foi configurado.`, `${E} Um administrador precisa configurar primeiro.`],
        { ephemeral: true }
      )
    );
    return true;
  }

  if (interaction.customId === PD_BTN_SETAR) {
    // Verifica limite por executor (admins não têm limite)
    if (!isAdmin) {
      const count = getPdHolderCountByExecutor(guild.id, interaction.user.id);
      if (count >= PD_MAX_PER_EXECUTOR) {
        await interaction.reply(
          containerReplyOrganized(
            [
              `${E} Voce ja atingiu o limite de **${PD_MAX_PER_EXECUTOR}** PDs.`,
              `${E} Remova uma antes de adicionar outra.`,
            ],
            { ephemeral: true }
          )
        );
        return true;
      }
    }

    const modal = new ModalBuilder()
      .setCustomId(PD_MODAL_SETAR)
      .setTitle("Setar Primeira Dama")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID do membro")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Cole o ID do membro aqui")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.customId === PD_BTN_REMOVER) {
    const modal = new ModalBuilder()
      .setCustomId(PD_MODAL_REMOVER)
      .setTitle("Remover Primeira Dama")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("user_id")
            .setLabel("ID do membro")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Cole o ID do membro aqui")
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return true;
  }

  return false;
}

// ── Handler de RoleSelectMenu ─────────────────────────────────────────────────
export async function handlePdRoleSelect(
  interaction: RoleSelectMenuInteraction
): Promise<boolean> {
  if (
    interaction.customId !== PD_SELECT_CARGO &&
    interaction.customId !== PD_SELECT_ACESSO
  ) return false;

  const guild = interaction.guild;
  if (!guild) return true;

  const executorMember = await fetchGuildMember(guild, interaction.user.id);
  const isAdmin = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;

  if (!isAdmin) {
    await interaction.reply(
      containerReplyOrganized([`${E} Apenas administradores podem configurar o sistema PD.`], { ephemeral: true })
    );
    return true;
  }

  const botMember = guild.members.me;

  if (interaction.customId === PD_SELECT_CARGO) {
    const role = interaction.roles.first();
    if (!role) return true;

    if (role.managed) {
      await interaction.reply(
        containerReplyOrganized([`${E} Nao e possivel usar cargos gerenciados por integracao.`], { ephemeral: true })
      );
      return true;
    }

    if (role.position >= (botMember?.roles.highest.position ?? 0)) {
      await interaction.reply(
        containerReplyOrganized(
          [`${E} O cargo <@&${role.id}> esta acima ou igual ao meu cargo na hierarquia.`],
          { ephemeral: true }
        )
      );
      return true;
    }

    setPdRole(guild.id, role.id);

    await interaction.update({
      components: [
        buildOrganizedContainer([
          "# **PRIMEIRA DAMA — Cargo PD**",
          [
            `${V} **Cargo configurado com sucesso**`,
            `${E} **Cargo PD:** <@&${role.id}>`,
            `${E} **Configurado por:** <@${interaction.user.id}>`,
          ].join("\n"),
        ]),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    // Deleta o painel de confirmação após 8 segundos
    const msg = await interaction.fetchReply().catch(() => null);
    if (msg) setTimeout(() => msg.delete().catch(() => null), 8000);

    await sendLog(guild, "cargo", [
      [
        `${V} **PD — Cargo configurado**`,
        `${E} **Cargo PD:** <@&${role.id}>`,
        `${E} **Administrador:** <@${interaction.user.id}>`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return true;
  }

  if (interaction.customId === PD_SELECT_ACESSO) {
    const roles = [...interaction.roles.values()];
    clearPdAllowedRoles(guild.id);
    for (const role of roles) {
      addPdAllowedRole(guild.id, role.id);
    }

    await interaction.update({
      components: [
        buildOrganizedContainer([
          "# **PRIMEIRA DAMA — Cargos de Acesso**",
          [
            `${V} **Cargos de acesso atualizados**`,
            `${E} **Cargos:** ${roles.map((r) => `<@&${r.id}>`).join(", ")}`,
            `${E} **Configurado por:** <@${interaction.user.id}>`,
          ].join("\n"),
        ]),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    // Deleta o painel de confirmação após 8 segundos
    const msg = await interaction.fetchReply().catch(() => null);
    if (msg) setTimeout(() => msg.delete().catch(() => null), 8000);

    await sendLog(guild, "cargo", [
      [
        `${V} **PD — Cargos de acesso atualizados**`,
        `${E} **Cargos:** ${roles.map((r) => `<@&${r.id}>`).join(", ")}`,
        `${E} **Administrador:** <@${interaction.user.id}>`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return true;
  }

  return false;
}

// ── Handler de Modal ──────────────────────────────────────────────────────────
export async function handlePdModal(
  interaction: ModalSubmitInteraction
): Promise<boolean> {
  if (
    interaction.customId !== PD_MODAL_SETAR &&
    interaction.customId !== PD_MODAL_REMOVER
  ) return false;

  const guild = interaction.guild;
  if (!guild) return true;

  const executorMember = await fetchGuildMember(guild, interaction.user.id);
  const isAdmin        = executorMember?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
  const memberRoleIds  = executorMember?.roles.cache.map((r) => r.id) ?? [];
  const hasAccess      = isAdmin || memberHasPdAccess(guild.id, memberRoleIds);

  if (!hasAccess) {
    await interaction.reply(
      containerReplyOrganized([`${E} Voce nao tem permissao para usar esta acao.`], { ephemeral: true })
    );
    return true;
  }

  const raw    = interaction.fields.getTextInputValue("user_id").trim();
  const userId = raw.replace(/[<@!>]/g, "");

  if (!/^\d{17,20}$/.test(userId)) {
    await interaction.reply(
      containerReplyOrganized([`${E} ID invalido. Informe um ID valido.`], { ephemeral: true })
    );
    return true;
  }

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    await interaction.reply(
      containerReplyOrganized([`${E} Membro nao encontrado no servidor.`], { ephemeral: true })
    );
    return true;
  }

  if (member.user.bot) {
    await interaction.reply(
      containerReplyOrganized([`${E} Nao e possivel usar este comando em bots.`], { ephemeral: true })
    );
    return true;
  }

  const roleId = getPdRoleId(guild.id);
  if (!roleId) {
    await interaction.reply(
      containerReplyOrganized([`${E} O cargo de PD nao esta configurado.`], { ephemeral: true })
    );
    return true;
  }

  const botMember = guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply(
      containerReplyOrganized([`${E} Nao tenho permissao para gerenciar cargos.`], { ephemeral: true })
    );
    return true;
  }

  const role = guild.roles.cache.get(roleId);
  if (!role || role.position >= botMember.roles.highest.position) {
    await interaction.reply(
      containerReplyOrganized([`${E} Nao consigo gerenciar o cargo PD (hierarquia).`], { ephemeral: true })
    );
    return true;
  }

  // ── SETAR ─────────────────────────────────────────────────────────────────
  if (interaction.customId === PD_MODAL_SETAR) {
    if (isPdHolder(guild.id, userId)) {
      await interaction.reply(
        containerReplyOrganized([`${E} <@${member.id}> ja possui o cargo PD.`], { ephemeral: true })
      );
      return true;
    }

    // Limite por executor (admins sem limite)
    if (!isAdmin) {
      const count = getPdHolderCountByExecutor(guild.id, interaction.user.id);
      if (count >= PD_MAX_PER_EXECUTOR) {
        await interaction.reply(
          containerReplyOrganized(
            [
              `${E} Voce ja atingiu o limite de **${PD_MAX_PER_EXECUTOR}** PDs.`,
              `${E} Remova uma antes de adicionar outra.`,
            ],
            { ephemeral: true }
          )
        );
        return true;
      }
    }

    await member.roles.add(roleId, `PD setado por ${interaction.user.tag}`);
    addPdHolder(guild.id, userId, interaction.user.id);

    await interaction.reply(
      containerReplyOrganized([
        "# **PRIMEIRA DAMA**",
        [
          `${V} **Cargo setado**`,
          `${E} **Membro:** <@${member.id}>`,
          `${E} **Cargo:** <@&${roleId}>`,
          `${E} **Executor:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ])
    );

    // Deleta a resposta de confirmação após 8 segundos
    const confirmMsg = await interaction.fetchReply().catch(() => null);
    if (confirmMsg) setTimeout(() => confirmMsg.delete().catch(() => null), 8000);

    // Deleta o painel original (mensagem do botão) também após 8 segundos
    if (interaction.message) {
      setTimeout(() => interaction.message?.delete().catch(() => null), 8000);
    }

    await sendLog(guild, "cargo", [
      [
        `${V} **PD setado**`,
        `${E} **Membro:** <@${member.id}>`,
        `${E} **Cargo:** <@&${roleId}>`,
        `${E} **Executor:** <@${interaction.user.id}>`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return true;
  }

  // ── REMOVER ───────────────────────────────────────────────────────────────
  if (interaction.customId === PD_MODAL_REMOVER) {
    if (!isPdHolder(guild.id, userId)) {
      await interaction.reply(
        containerReplyOrganized([`${E} <@${member.id}> nao possui o cargo PD.`], { ephemeral: true })
      );
      return true;
    }

    // Não-admins só podem remover quem eles mesmos setaram
    if (!isAdmin) {
      const grantedBy = getPdHolderGrantedBy(guild.id, userId);
      if (grantedBy !== interaction.user.id) {
        await interaction.reply(
          containerReplyOrganized(
            [`${E} Voce nao pode remover esta PD — foi setada por outro membro.`],
            { ephemeral: true }
          )
        );
        return true;
      }
    }

    await member.roles.remove(roleId, `PD removido por ${interaction.user.tag}`);
    removePdHolder(guild.id, userId);

    await interaction.reply(
      containerReplyOrganized([
        "# **PRIMEIRA DAMA**",
        [
          `${V} **Cargo removido**`,
          `${E} **Membro:** <@${member.id}>`,
          `${E} **Cargo:** <@&${roleId}>`,
          `${E} **Executor:** <@${interaction.user.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ])
    );

    // Deleta a resposta de confirmação após 8 segundos
    const confirmMsg = await interaction.fetchReply().catch(() => null);
    if (confirmMsg) setTimeout(() => confirmMsg.delete().catch(() => null), 8000);

    // Deleta o painel original (mensagem do botão) também após 8 segundos
    if (interaction.message) {
      setTimeout(() => interaction.message?.delete().catch(() => null), 8000);
    }

    await sendLog(guild, "cargo", [
      [
        `${V} **PD removido**`,
        `${E} **Membro:** <@${member.id}>`,
        `${E} **Cargo:** <@&${roleId}>`,
        `${E} **Executor:** <@${interaction.user.id}>`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return true;
  }

  return false;
}
