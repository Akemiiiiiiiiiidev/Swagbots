import {
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  MessageFlags,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
  VoiceState,
} from "discord.js";
import { getDatabase } from "../database";
import { buildOrganizedContainer } from "./container";

export const LOG_TYPES = {
  comandos: { channel: "🖤・logs-comandos", title: "COMANDO" },
  ban:      { channel: "🖤・logs-ban",      title: "BANIMENTO" },
  mute:     { channel: "🖤・logs-mute",     title: "SILENCIAMENTO" },
  call:     { channel: "🖤・logs-call",     title: "CALL" },
  cargo:    { channel: "🖤・logs-cargo",    title: "CARGO" },
  ticket:   { channel: "🖤・logs-ticket",   title: "TICKET" },
} as const;

export type LogType = keyof typeof LOG_TYPES;

function ensureLogChannelsTable() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS log_channels (
      guild_id TEXT NOT NULL,
      log_type TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, log_type)
    );
  `);
}

export function initLogs() {
  ensureLogChannelsTable();
}

function saveLogChannel(guildId: string, logType: LogType, channelId: string) {
  const db = getDatabase();

  db.prepare(
    `
    INSERT INTO log_channels (guild_id, log_type, channel_id)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, log_type)
    DO UPDATE SET channel_id = excluded.channel_id
  `
  ).run(guildId, logType, channelId);
}

export function getLogChannelId(
  guildId: string,
  logType: LogType
): string | null {
  const db = getDatabase();

  const row = db
    .prepare(
      `
    SELECT channel_id as channelId
    FROM log_channels
    WHERE guild_id = ? AND log_type = ?
  `
    )
    .get(guildId, logType) as { channelId: string } | undefined;

  return row?.channelId ?? null;
}

function buildStaffOverwrites(guild: Guild) {
  const overwrites = [];

  for (const role of guild.roles.cache.values()) {
    if (
      role.id !== guild.id &&
      role.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      overwrites.push({
        id: role.id,
        type: OverwriteType.Role,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }
  }

  return overwrites;
}

export async function setupLogChannels(guild: Guild) {
  await guild.channels.fetch();

  let category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory && channel.name === "LOGS"
  );

  if (!category) {
    category = await guild.channels.create({
      name: "LOGS",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.members.me!.id,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...buildStaffOverwrites(guild),
      ],
    });
  }

  const created: string[] = [];

  for (const [logType, config] of Object.entries(LOG_TYPES)) {
    const existingId = getLogChannelId(guild.id, logType as LogType);
    const existingChannel = existingId
      ? guild.channels.cache.get(existingId)
      : null;

    if (existingChannel?.isTextBased()) {
      created.push(`<#${existingChannel.id}>`);
      continue;
    }

    const channel = await guild.channels.create({
      name: config.channel,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `Registro de acoes: ${config.title}`,
      permissionOverwrites: [
        {
          id: guild.id,
          type: OverwriteType.Role,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.members.me!.id,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...buildStaffOverwrites(guild),
      ],
    });

    saveLogChannel(guild.id, logType as LogType, channel.id);
    created.push(`<#${channel.id}>`);
  }

  return created;
}

export async function sendLogWithFiles(
  guild: Guild,
  logType: LogType,
  sections: string[],
  files: { attachment: Buffer | string; name: string }[]
) {
  const channelId = getLogChannelId(guild.id, logType);
  if (!channelId) return;

  const channel =
    guild.channels.cache.get(channelId) ??
    (await guild.channels.fetch(channelId).catch(() => null));

  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const logChannel = channel as TextChannel;
  const title = LOG_TYPES[logType].title;
  const content = [`# **${title}**`, ...sections];

  try {
    await logChannel.send({
      components: [buildOrganizedContainer(content)],
      flags: MessageFlags.IsComponentsV2,
    });

    if (files.length > 0) {
      await logChannel.send({
        content: "**Relatorio do ticket**",
        files: files.map((file) => ({
          attachment: file.attachment,
          name: file.name,
        })),
      });
    }
  } catch (error) {
    console.error(`Erro ao enviar log com arquivo (${logType}):`, error);
  }
}

export async function sendLog(
  guild: Guild,
  logType: LogType,
  sections: string[]
) {
  const channelId = getLogChannelId(guild.id, logType);
  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);

  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const title = LOG_TYPES[logType].title;
  const content = [`# **${title}**`, ...sections];

  await (channel as TextChannel)
    .send({
      components: [buildOrganizedContainer(content)],
      flags: MessageFlags.IsComponentsV2,
    })
    .catch((error) => {
      console.error(`Erro ao enviar log (${logType}):`, error);
    });
}

export async function logCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  const options = interaction.options.data
    .map((option) => `**${option.name}:** ${option.value}`)
    .join("\n");

  await sendLog(interaction.guild, "comandos", [
    [
      `**Comando:** /${interaction.commandName}`,
      `**Usuario:** <@${interaction.user.id}>`,
      `**Canal:** <#${interaction.channelId}>`,
      `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      options ? `**Opcoes:**\n${options}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  ]);
}

export async function logVoiceStateChange(
  oldState: VoiceState,
  newState: VoiceState
) {
  if (newState.member?.user.bot) return;

  const guild = newState.guild;
  const userId = newState.id;

  const joined =
    !oldState.channelId && newState.channelId
      ? newState.channel
      : null;

  const left =
    oldState.channelId && !newState.channelId ? oldState.channel : null;

  const moved =
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId;

  if (joined) {
    await sendLog(guild, "call", [
      [
        "**Entrou em call**",
        `**Usuario:** <@${userId}>`,
        `**Canal:** ${joined.name}`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return;
  }

  if (left) {
    await sendLog(guild, "call", [
      [
        "**Saiu da call**",
        `**Usuario:** <@${userId}>`,
        `**Canal:** ${left.name}`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
    return;
  }

  if (moved) {
    await sendLog(guild, "call", [
      [
        "**Trocou de call**",
        `**Usuario:** <@${userId}>`,
        `**De:** ${oldState.channel?.name ?? "desconhecido"}`,
        `**Para:** ${newState.channel?.name ?? "desconhecido"}`,
        `**Data:** <t:${Math.floor(Date.now() / 1000)}:F>`,
      ].join("\n"),
    ]);
  }
}
