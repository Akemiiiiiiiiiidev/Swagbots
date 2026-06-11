import {
  AuditLogEvent,
  Client,
  Events,
  Guild,
  GuildAuditLogsEntry,
  GuildMember,
} from "discord.js";
import { E } from "../utils/container";
import { sendLog } from "../utils/logs";
import { getAutoRoleId } from "../utils/autoRole";
import { isSetarCargoProtectionEnabled } from "../utils/setarCargo";

// Aguarda ms antes de tentar buscar o executor (audit log pode ter latência)
function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMemberWithRetry(guild: Guild, userId: string, retries = 3): Promise<GuildMember | null> {
  for (let i = 0; i < retries; i++) {
    const member = await guild.members.fetch({ user: userId, force: true }).catch(() => null);
    if (member) return member;
    if (i < retries - 1) await wait(500);
  }
  return null;
}

async function handleMemberRoleUpdate(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
) {
  // Ignora APENAS o próprio bot
  const botId = guild.client.user?.id;
  if (!botId) return;
  if (entry.executor?.id === botId) return;

  // Lê os cargos adicionados e removidos do audit log
  const changes = entry.changes ?? [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const change of changes) {
    const list = (change.new as { id: string; name: string }[] | undefined) ?? [];
    if (change.key === "$add") {
      for (const r of list) added.push(r.id);
    }
    if (change.key === "$remove") {
      for (const r of list) removed.push(r.id);
    }
  }

  if (added.length === 0 && removed.length === 0) return;

  // Garante cache de roles atualizado
  await guild.roles.fetch();

  const botMember = await guild.members.fetchMe().catch(() => guild.members.me);
  if (!botMember) return;
  const botHighest = botMember.roles.highest.position;

  // Busca o membro alvo com retry
  const targetId = (entry.target as { id?: string } | null)?.id;
  if (!targetId) return;

  const member = await fetchMemberWithRetry(guild, targetId);
  if (!member) return;

  // Reverte adições: remove cada cargo adicionado manualmente
  for (const roleId of added) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;
    try {
      await member.roles.remove(roleId, "SetarCargo: revertendo adicao manual");
    } catch (err) {
      console.error(`[SetarCargo] Nao foi possivel remover cargo ${role.name} (${roleId}):`, err);
    }
  }

  // Reverte remoções: readiciona cada cargo removido manualmente
  for (const roleId of removed) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;
    try {
      await member.roles.add(roleId, "SetarCargo: revertendo remocao manual");
    } catch (err) {
      console.error(`[SetarCargo] Nao foi possivel readicionar cargo ${role.name} (${roleId}):`, err);
    }
  }

  // Pune o executor com retry
  const executorId = entry.executor?.id;
  if (executorId && executorId !== guild.ownerId) {
    const executor = await fetchMemberWithRetry(guild, executorId);
    if (executor) {
      const autoRoleId = getAutoRoleId(guild.id);
      const rolesToRemove = executor.roles.cache
        .filter((r) =>
          r.id !== guild.id &&
          r.position < botHighest &&
          (autoRoleId ? r.id !== autoRoleId : true)
        )
        .map((r) => r.id);

      if (rolesToRemove.length > 0) {
        try {
          await executor.roles.remove(rolesToRemove, "SetarCargo: alteracao manual nao autorizada");
        } catch (err) {
          console.error("[SetarCargo] Erro ao punir executor:", err);
        }
      }
    }
  }

  const roleList = [
    ...added.map((id) => `+<@&${id}>`),
    ...removed.map((id) => `-<@&${id}>`),
  ].join(", ");

  await sendLog(guild, "cargo", [
    [
      `${E} **⚠️ Alteracao manual de cargo revertida**`,
      `${E} **Executor:** ${executorId ? `<@${executorId}>` : "Desconhecido"}`,
      `${E} **Alvo:** <@${targetId}>`,
      `${E} **Cargos:** ${roleList}`,
      `${E} **Acao:** Alteracao revertida e cargos do executor removidos`,
      `${E} **Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
    ].join("\n"),
  ]);
}

export function registerSetarCargoProtection(client: Client) {
  client.on(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    try {
      if (!isSetarCargoProtectionEnabled(guild.id)) return;
      if (entry.action !== AuditLogEvent.MemberRoleUpdate) return;

      await handleMemberRoleUpdate(
        guild,
        entry as GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
      );
    } catch (error) {
      console.error("Erro na protecao de setar cargo:", error);
    }
  });
}
