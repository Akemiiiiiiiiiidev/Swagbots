import {
  AuditLogEvent,
  Client,
  ColorResolvable,
  Events,
  Guild,
  GuildAuditLogsEntry,
  PermissionFlagsBits,
  Role,
} from "discord.js";
import { getAutoRoleId } from "../utils/autoRole";
import { sendLog } from "../utils/logs";
import { E } from "../utils/container";
import { isRoleProtectionEnabled } from "../utils/roleProtection";

async function punishExecutor(guild: Guild, executorId: string) {
  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member) return;
  if (member.user.bot) return;
  if (member.id === guild.ownerId) return;

  const botMember = guild.members.me;
  if (!botMember) return;
  if (member.roles.highest.position >= botMember.roles.highest.position) return;

  const autoRoleId = getAutoRoleId(guild.id);

  const rolesToRemove = member.roles.cache
    .filter((r) => r.id !== guild.id && (autoRoleId ? r.id !== autoRoleId : true))
    .map((r) => r.id);

  try {
    if (rolesToRemove.length > 0) {
      await member.roles.remove(
        rolesToRemove,
        "Protecao de cargos: alteracao nao autorizada"
      );
    }

    await sendLog(guild, "cargo", [
      [
        `${E} **⚠️ Protecao de cargos ativada**`,
        `${E} **Executor:** <@${executorId}>`,
        `${E} **Acao:** Todos os cargos foram removidos`,
        `${E} **Motivo:** Tentativa de alterar/deletar cargo sem permissao de Administrador`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  } catch (error) {
    console.error("Erro ao punir executor na protecao de cargos:", error);
  }
}

async function handleRoleDelete(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.RoleDelete>
) {
  if (!entry.executor) return;
  if (entry.executor.id === guild.client.user?.id) return;

  const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
  if (!executor) return;
  if (executor.permissions.has(PermissionFlagsBits.Administrator)) return;

  // Recria o cargo com as propriedades originais
  const changes = entry.changes ?? [];
  const name =
    (changes.find((c) => c.key === "name")?.old as string | undefined) ?? "cargo-restaurado";
  const color =
    (changes.find((c) => c.key === "color")?.old as number | undefined) ?? 0;
  const hoist =
    (changes.find((c) => c.key === "hoist")?.old as boolean | undefined) ?? false;
  const mentionable =
    (changes.find((c) => c.key === "mentionable")?.old as boolean | undefined) ?? false;

  try {
    await guild.roles.create({
      name,
      color: color as ColorResolvable,
      hoist,
      mentionable,
      reason: "Protecao de cargos: restaurando cargo deletado",
    });
  } catch (error) {
    console.error("Erro ao recriar cargo deletado:", error);
  }

  await punishExecutor(guild, entry.executor.id);
}

async function handleRoleUpdate(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.RoleUpdate>
) {
  if (!entry.executor) return;
  if (entry.executor.id === guild.client.user?.id) return;

  const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
  if (!executor) return;
  if (executor.permissions.has(PermissionFlagsBits.Administrator)) return;

  // Reverte as alterações no cargo
  const role = entry.target as Role | null;
  if (role) {
    try {
      const changes = entry.changes ?? [];
      const patch: Record<string, unknown> = {};

      for (const change of changes) {
        if (["name", "color", "hoist", "mentionable", "permissions"].includes(change.key)) {
          patch[change.key] = change.old;
        }
      }

      if (Object.keys(patch).length > 0) {
        await role.edit(patch as Parameters<Role["edit"]>[0]);
      }
    } catch (error) {
      console.error("Erro ao reverter alteracao de cargo:", error);
    }
  }

  await punishExecutor(guild, entry.executor.id);
}

export function registerRoleProtection(client: Client) {
  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    try {
      if (!isRoleProtectionEnabled(guild.id)) return;

      if (entry.action === AuditLogEvent.RoleDelete) {
        await handleRoleDelete(
          guild,
          entry as GuildAuditLogsEntry<AuditLogEvent.RoleDelete>
        );
      } else if (entry.action === AuditLogEvent.RoleUpdate) {
        await handleRoleUpdate(
          guild,
          entry as GuildAuditLogsEntry<AuditLogEvent.RoleUpdate>
        );
      }
    } catch (error) {
      console.error("Erro no sistema de protecao de cargos:", error);
    }
  });
}
