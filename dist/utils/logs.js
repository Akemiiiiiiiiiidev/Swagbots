"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_TYPES = void 0;
exports.initLogs = initLogs;
exports.getLogChannelId = getLogChannelId;
exports.setupLogChannels = setupLogChannels;
exports.sendLogWithFiles = sendLogWithFiles;
exports.sendLog = sendLog;
exports.logCommand = logCommand;
exports.logVoiceStateChange = logVoiceStateChange;
const discord_js_1 = require("discord.js");
const database_1 = require("../database");
const container_1 = require("./container");
exports.LOG_TYPES = {
    comandos: { channel: "🖤・logs-comandos", title: "COMANDO" },
    ban: { channel: "🖤・logs-ban", title: "BANIMENTO" },
    mute: { channel: "🖤・logs-mute", title: "SILENCIAMENTO" },
    call: { channel: "🖤・logs-call", title: "CALL" },
    cargo: { channel: "🖤・logs-cargo", title: "CARGO" },
    ticket: { channel: "🖤・logs-ticket", title: "TICKET" },
};
function ensureLogChannelsTable() {
    const db = (0, database_1.getDatabase)();
    db.exec(`
    CREATE TABLE IF NOT EXISTS log_channels (
      guild_id TEXT NOT NULL,
      log_type TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, log_type)
    );
  `);
}
function initLogs() {
    ensureLogChannelsTable();
}
function saveLogChannel(guildId, logType, channelId) {
    const db = (0, database_1.getDatabase)();
    db.prepare(`
    INSERT INTO log_channels (guild_id, log_type, channel_id)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, log_type)
    DO UPDATE SET channel_id = excluded.channel_id
  `).run(guildId, logType, channelId);
}
function getLogChannelId(guildId, logType) {
    const db = (0, database_1.getDatabase)();
    const row = db
        .prepare(`
    SELECT channel_id as channelId
    FROM log_channels
    WHERE guild_id = ? AND log_type = ?
  `)
        .get(guildId, logType);
    return row?.channelId ?? null;
}
function buildStaffOverwrites(guild) {
    const overwrites = [];
    for (const role of guild.roles.cache.values()) {
        if (role.id !== guild.id &&
            role.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
            overwrites.push({
                id: role.id,
                type: discord_js_1.OverwriteType.Role,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                ],
            });
        }
    }
    return overwrites;
}
async function setupLogChannels(guild) {
    await guild.channels.fetch();
    let category = guild.channels.cache.find((channel) => channel.type === discord_js_1.ChannelType.GuildCategory && channel.name === "LOGS");
    if (!category) {
        category = await guild.channels.create({
            name: "LOGS",
            type: discord_js_1.ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    type: discord_js_1.OverwriteType.Role,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
                },
                {
                    id: guild.members.me.id,
                    type: discord_js_1.OverwriteType.Member,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                ...buildStaffOverwrites(guild),
            ],
        });
    }
    const created = [];
    for (const [logType, config] of Object.entries(exports.LOG_TYPES)) {
        const existingId = getLogChannelId(guild.id, logType);
        const existingChannel = existingId
            ? guild.channels.cache.get(existingId)
            : null;
        if (existingChannel?.isTextBased()) {
            created.push(`<#${existingChannel.id}>`);
            continue;
        }
        const channel = await guild.channels.create({
            name: config.channel,
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            topic: `Registro de acoes: ${config.title}`,
            permissionOverwrites: [
                {
                    id: guild.id,
                    type: discord_js_1.OverwriteType.Role,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
                },
                {
                    id: guild.members.me.id,
                    type: discord_js_1.OverwriteType.Member,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                ...buildStaffOverwrites(guild),
            ],
        });
        saveLogChannel(guild.id, logType, channel.id);
        created.push(`<#${channel.id}>`);
    }
    return created;
}
async function sendLogWithFiles(guild, logType, sections, files) {
    const channelId = getLogChannelId(guild.id, logType);
    if (!channelId)
        return;
    const channel = guild.channels.cache.get(channelId) ??
        (await guild.channels.fetch(channelId).catch(() => null));
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const logChannel = channel;
    const title = exports.LOG_TYPES[logType].title;
    const content = [`# **${title}**`, ...sections];
    try {
        await logChannel.send({
            components: [(0, container_1.buildOrganizedContainer)(content)],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
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
    }
    catch (error) {
        console.error(`Erro ao enviar log com arquivo (${logType}):`, error);
    }
}
async function sendLog(guild, logType, sections) {
    const channelId = getLogChannelId(guild.id, logType);
    if (!channelId)
        return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const title = exports.LOG_TYPES[logType].title;
    const content = [`# **${title}**`, ...sections];
    await channel
        .send({
        components: [(0, container_1.buildOrganizedContainer)(content)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    })
        .catch((error) => {
        console.error(`Erro ao enviar log (${logType}):`, error);
    });
}
async function logCommand(interaction) {
    if (!interaction.guild)
        return;
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
async function logVoiceStateChange(oldState, newState) {
    if (newState.member?.user.bot)
        return;
    const guild = newState.guild;
    const userId = newState.id;
    const joined = !oldState.channelId && newState.channelId
        ? newState.channel
        : null;
    const left = oldState.channelId && !newState.channelId ? oldState.channel : null;
    const moved = oldState.channelId &&
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
//# sourceMappingURL=logs.js.map