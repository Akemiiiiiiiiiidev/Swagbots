"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKET_CATEGORIES = exports.TICKET_OPEN_PREFIX = exports.TICKET_CLOSE_ID = void 0;
exports.initTickets = initTickets;
exports.getTicketCategory = getTicketCategory;
exports.parseTicketOpenId = parseTicketOpenId;
exports.isTicketButton = isTicketButton;
exports.getUserTicket = getUserTicket;
exports.getTicketByChannel = getTicketByChannel;
exports.removeTicket = removeTicket;
exports.buildTicketPanelContainer = buildTicketPanelContainer;
exports.buildTicketChannelContainer = buildTicketChannelContainer;
exports.createTicketChannel = createTicketChannel;
exports.closeTicketChannel = closeTicketChannel;
const discord_js_1 = require("discord.js");
const database_1 = require("../database");
const container_1 = require("./container");
const ticketMessageCache_1 = require("./ticketMessageCache");
const ticketCloseLog_1 = require("./ticketCloseLog");
exports.TICKET_CLOSE_ID = "ticket:close";
exports.TICKET_OPEN_PREFIX = "ticket:open:";
exports.TICKET_CATEGORIES = [
    { id: "suporte", label: "Suporte", motivo: "Suporte geral (Parceiras, Duvidas e Denuncias)" },
    { id: "verificacao", label: "Verificacao", motivo: "Relacionado ao Instagram" },
    { id: "recrutamento", label: "Recrutamento", motivo: "Candidatura ou contato com a equipe" },
];
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      guild_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      category   TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets (channel_id);
  `);
}
function initTickets() {
    ensureTable();
}
function getTicketCategory(id) {
    return exports.TICKET_CATEGORIES.find((c) => c.id === id) ?? null;
}
function parseTicketOpenId(customId) {
    if (!customId.startsWith(exports.TICKET_OPEN_PREFIX))
        return null;
    const categoryId = customId.slice(exports.TICKET_OPEN_PREFIX.length);
    return getTicketCategory(categoryId)?.id ?? null;
}
function isTicketButton(customId) {
    return customId === exports.TICKET_CLOSE_ID || parseTicketOpenId(customId) !== null;
}
function getUserTicket(guildId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT channel_id as channelId, user_id as userId, category, created_at as createdAt
       FROM tickets WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    return row ?? null;
}
function getTicketByChannel(channelId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT channel_id as channelId, user_id as userId, category, created_at as createdAt
       FROM tickets WHERE channel_id = ?`)
        .get(channelId);
    return row ?? null;
}
function saveTicket(guildId, record) {
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO tickets (guild_id, user_id, channel_id, category, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
         channel_id = excluded.channel_id,
         category   = excluded.category,
         created_at = excluded.created_at`)
        .run(guildId, record.userId, record.channelId, record.category, record.createdAt);
}
function removeTicket(guildId, userId) {
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM tickets WHERE guild_id = ? AND user_id = ?`)
        .run(guildId, userId);
}
function buildStaffOverwrites(guild) {
    const overwrites = [];
    for (const role of guild.roles.cache.values()) {
        if (role.id !== guild.id && role.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
            overwrites.push({
                id: role.id,
                type: discord_js_1.OverwriteType.Role,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                ],
            });
        }
    }
    return overwrites;
}
function buildTicketPanelContainer() {
    const buttons = exports.TICKET_CATEGORIES.map((category) => new discord_js_1.ButtonBuilder()
        .setCustomId(`${exports.TICKET_OPEN_PREFIX}${category.id}`)
        .setLabel(category.label)
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    return (0, container_1.buildOrganizedContainer)([
        "# **TICKET**",
        ["Selecione o tipo de atendimento abaixo.", "A equipe ira responder o mais rapido possivel."].join("\n"),
        exports.TICKET_CATEGORIES.map((c) => `**${c.label}:** ${c.motivo}`).join("\n"),
    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(buttons));
}
function buildTicketChannelContainer(userId, categoryLabel, motivo) {
    return (0, container_1.buildOrganizedContainer)([
        "# **TICKET**",
        [
            `**Usuario:** <@${userId}>`,
            `**Categoria:** ${categoryLabel}`,
            `**Motivo:** ${motivo}`,
            `**Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
        "A equipe ira responder em breve. Use o botao abaixo para fechar o ticket.",
    ]).addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(exports.TICKET_CLOSE_ID)
        .setLabel("Fechar ticket")
        .setStyle(discord_js_1.ButtonStyle.Secondary)));
}
async function createTicketChannel(guild, member, categoryId, motivo, parentId) {
    const category = getTicketCategory(categoryId);
    const ticketMotivo = motivo ?? category.motivo;
    const channel = await guild.channels.create({
        name: `📑・${category.id}-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-📑・]/gu, ""),
        type: discord_js_1.ChannelType.GuildText,
        parent: parentId ?? undefined,
        permissionOverwrites: [
            { id: guild.id, type: discord_js_1.OverwriteType.Role, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            {
                id: member.id,
                type: discord_js_1.OverwriteType.Member,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    discord_js_1.PermissionFlagsBits.AttachFiles,
                ],
            },
            {
                id: guild.members.me.id,
                type: discord_js_1.OverwriteType.Member,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    discord_js_1.PermissionFlagsBits.ManageChannels,
                ],
            },
            ...buildStaffOverwrites(guild),
        ],
    });
    saveTicket(guild.id, {
        channelId: channel.id,
        userId: member.id,
        category: categoryId,
        createdAt: Date.now(),
    });
    const openingMessage = await channel.send({
        components: [buildTicketChannelContainer(member.id, category.label, ticketMotivo)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    });
    (0, ticketMessageCache_1.cacheTicketMessage)(openingMessage);
    return channel;
}
async function closeTicketChannel(guild, channel, ticket, closedById) {
    await (0, ticketCloseLog_1.sendTicketCloseLog)(guild, channel, ticket, closedById);
    removeTicket(guild.id, ticket.userId);
    await channel.delete(`Ticket fechado por solicitacao`);
}
//# sourceMappingURL=tickets.js.map