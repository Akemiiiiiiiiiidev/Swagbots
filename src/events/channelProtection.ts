import {
  AuditLogEvent,
  CategoryChannel,
  ChannelType,
  Client,
  Events,
  Guild,
  GuildAuditLogsEntry,
  GuildChannel,
  OverwriteData,
  PermissionFlagsBits,
  PermissionOverwrites,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { E } from "../utils/container";
import { sendLog } from "../utils/logs";
import { getAutoRoleId } from "../utils/autoRole";

// Aguarda ms (audit log tem latência)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Serializa as permissões de um canal para restauração ──────────────────────
function serializeOverwrites(channel: GuildChannel): OverwriteData[] {
  return channel.permissionOverwrites.cache.map((overwrite: PermissionOverwrites) => ({
    id: overwrite.id,
    type: overwrite.type,
    allow: overwrite.allow,
    deny: overwrite.deny,
  }));
}

// ── Pune o executor (remove todos os cargos exceto autorole) ─────────────────
async function punishExecutor(guild: Guild, executorId: string) {
  if (!executorId) return;
  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member) return;
  if (member.user.bot) return;
  if (member.id === guild.ownerId) return;

  const botMember = guild.members.me;
  if (!botMember) return;
  if (member.roles.highest.position >= botMember.roles.highest.position) return;

  const autoRoleId = getAutoRoleId(guild.id);

  const rolesToRemove = member.roles.cache
    .filter((r) =>
      r.id !== guild.id &&
      r.position < botMember.roles.highest.position &&
      (autoRoleId ? r.id !== autoRoleId : true)
    )
    .map((r) => r.id);

  try {
    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove, "Protecao de canais: acao nao autorizada");
    }
  } catch (err) {
    console.error("[ChannelProtection] Erro ao punir executor:", err);
  }

  await sendLog(guild, "call", [
    [
      `${E} **⚠️ Protecao de canais ativada**`,
      `${E} **Executor punido:** <@${executorId}>`,
      `${E} **Acao:** Todos os cargos removidos`,
      `${E} **Motivo:** Tentativa de alterar/mover/deletar canal sem permissao de Administrador`,
      `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
    ].join("\n"),
  ]);
}

// ── Handler: canal deletado ───────────────────────────────────────────────────
async function handleChannelDelete(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.ChannelDelete>
) {
  if (!entry.executor) return;
  if (entry.executor.id === guild.client.user?.id) return;

  await wait(300);
  const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
  if (!executor) return;
  if (executor.permissions.has(PermissionFlagsBits.Administrator)) return;

  // Coleta dados do canal deletado dos changes do audit log
  const changes = entry.changes ?? [];
  const name =
    (changes.find((c) => c.key === "name")?.old as string | undefined) ??
    "canal-restaurado";
  const typeRaw =
    (changes.find((c) => c.key === "type")?.old as number | undefined) ?? 0;
  const parentIdChange = changes.find((c) => (c.key as string) === "parent_id");
  const parentId = (parentIdChange?.old as string | undefined) ?? undefined;
  const position =
    (changes.find((c) => c.key === "position")?.old as number | undefined) ?? 0;
  const overwrites =
    (changes.find((c) => (c.key as string) === "permission_overwrites")?.old as OverwriteData[] | undefined) ?? [];

  // Mapeia type number para ChannelType
  const channelTypeMap: Partial<Record<number, ChannelType>> = {
    0:  ChannelType.GuildText,
    2:  ChannelType.GuildVoice,
    4:  ChannelType.GuildCategory,
    5:  ChannelType.GuildAnnouncement,
    13: ChannelType.GuildStageVoice,
    15: ChannelType.GuildForum,
  };
  const channelType = channelTypeMap[typeRaw] ?? ChannelType.GuildText;

  try {
    await guild.channels.create({
      name,
      type: channelType as
        | ChannelType.GuildText
        | ChannelType.GuildVoice
        | ChannelType.GuildCategory
        | ChannelType.GuildAnnouncement
        | ChannelType.GuildStageVoice
        | ChannelType.GuildForum,
      parent: parentId,
      position,
      permissionOverwrites: overwrites,
      reason: "Protecao de canais: restaurando canal deletado",
    });

    await sendLog(guild, "call", [
      [
        `${E} **⚠️ Canal deletado e restaurado**`,
        `${E} **Canal:** ${name}`,
        `${E} **Executor:** <@${entry.executor.id}>`,
        `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  } catch (err) {
    console.error("[ChannelProtection] Erro ao recriar canal:", err);
  }

  await punishExecutor(guild, entry.executor.id);
}

// ── Handler: canal atualizado (movido ou renomeado) ───────────────────────────
async function handleChannelUpdate(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.ChannelUpdate>
) {
  if (!entry.executor) return;
  if (entry.executor.id === guild.client.user?.id) return;

  await wait(300);
  const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
  if (!executor) return;
  if (executor.permissions.has(PermissionFlagsBits.Administrator)) return;

  const channel = entry.target as GuildChannel | null;
  if (!channel) return;

  // Reverte as mudanças
  const changes = entry.changes ?? [];
  const patch: Record<string, unknown> = {};

  for (const change of changes) {
    const key = change.key as string;
    if (
      ["name", "parent_id", "position", "topic", "bitrate", "user_limit"].includes(key)
    ) {
      const patchKey = key === "parent_id" ? "parentId" : key;
      patch[patchKey] = change.old ?? null;
    }
  }

  if (Object.keys(patch).length > 0) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await channel.edit(patch as any);

      await sendLog(guild, "call", [
        [
          `${E} **⚠️ Alteracao de canal revertida**`,
          `${E} **Canal:** <#${channel.id}>`,
          `${E} **Executor:** <@${entry.executor.id}>`,
          `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
      ]);
    } catch (err) {
      console.error("[ChannelProtection] Erro ao reverter canal:", err);
    }
  }

  await punishExecutor(guild, entry.executor.id);
}

// ── Handler: overwrite de permissão alterado ──────────────────────────────────
async function handleChannelOverwriteUpdate(
  guild: Guild,
  entry: GuildAuditLogsEntry<
    | AuditLogEvent.ChannelOverwriteCreate
    | AuditLogEvent.ChannelOverwriteUpdate
    | AuditLogEvent.ChannelOverwriteDelete
  >
) {
  if (!entry.executor) return;
  if (entry.executor.id === guild.client.user?.id) return;

  await wait(300);
  const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
  if (!executor) return;
  if (executor.permissions.has(PermissionFlagsBits.Administrator)) return;

  const channel = entry.target as GuildChannel | null;
  if (!channel) return;

  // Não temos o estado anterior das overwrites de forma confiável,
  // mas punimos quem tentou alterar permissões sem ser admin
  await punishExecutor(guild, entry.executor.id);
}

// ── Registro ──────────────────────────────────────────────────────────────────
export function registerChannelProtection(client: Client) {
  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    try {
      switch (entry.action) {
        case AuditLogEvent.ChannelDelete:
          await handleChannelDelete(
            guild,
            entry as GuildAuditLogsEntry<AuditLogEvent.ChannelDelete>
          );
          break;

        case AuditLogEvent.ChannelUpdate:
          await handleChannelUpdate(
            guild,
            entry as GuildAuditLogsEntry<AuditLogEvent.ChannelUpdate>
          );
          break;

        case AuditLogEvent.ChannelOverwriteCreate:
        case AuditLogEvent.ChannelOverwriteUpdate:
        case AuditLogEvent.ChannelOverwriteDelete:
          await handleChannelOverwriteUpdate(
            guild,
            entry as GuildAuditLogsEntry<
              | AuditLogEvent.ChannelOverwriteCreate
              | AuditLogEvent.ChannelOverwriteUpdate
              | AuditLogEvent.ChannelOverwriteDelete
            >
          );
          break;
      }
    } catch (error) {
      console.error("[ChannelProtection] Erro:", error);
    }
  });
}
