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

async function handleMemberRoleUpdate(
  guild: Guild,
  entry: GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>
) {
  if (!entry.executor) return;

  // Ignora APENAS o próprio bot
  if (entry.executor.id === guild.client.user?.id) return;

  const botMember = guild.members.me;
  if (!botMember) return;

  const botHighest = botMember.roles.highest.position;

  // Garante que o cache de roles está atualizado
  await guild.roles.fetch();

  // Lê os cargos adicionados e removidos do audit log
  const changes = entry.changes ?? [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const change of changes) {
    // Discord usa change.new para listar os cargos afetados em $add e $remove
    const list = (change.new as { id: string; name: string }[] | undefined) ?? [];
    if (change.key === "$add") {
      for (const r of list) added.push(r.id);
    }
    if (change.key === "$remove") {
      for (const r of list) removed.push(r.id);
    }
  }

  if (added.length === 0 && removed.length === 0) return;

  // Busca o membro alvo atualizado
  const targetId = (entry.target as { id?: string } | null)?.id;
  if (!targetId) return;

  const member = await guild.members.fetch({ user: targetId, force: true }).catch(() => null);
  if (!member) return;

  // Reverte adições: remove cada cargo adicionado manualmente
  for (const roleId of added) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;

    try {
      await member.roles.remove(roleId, "SetarCargo: revertendo adicao manual");
    } catch (err) {
      console.error(`[SetarCargo] Nao foi possivel remover cargo ${role.name} (${roleId}) do membro ${member.user.tag}:`, err);
    }
  }

  // Reverte remoções: readiciona cada cargo removido manualmente
  for (const roleId of removed) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;

    try {
      await member.roles.add(roleId, "SetarCargo: revertendo remocao manual");
    } catch (err) {
      console.error(`[SetarCargo] Nao foi possivel readicionar cargo ${role.name} (${roleId}) ao membro ${member.user.tag}:`, err);
    }
  }

  // Pune o executor: remove todos os cargos que o bot conseguir remover
  const executor = await guild.members.fetch({ user: entry.executor.id, force: true }).catch(() => null);
  if (executor && executor.id !== guild.ownerId) {
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

  const roleList = [
    ...added.map((id) => `+<@&${id}>`),
    ...removed.map((id) => `-<@&${id}>`),
  ].join(", ");

  await sendLog(guild, "cargo", [
    [
      `${E} **⚠️ Alteracao manual de cargo revertida**`,
      `${E} **Executor:** <@${entry.executor.id}>`,
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
