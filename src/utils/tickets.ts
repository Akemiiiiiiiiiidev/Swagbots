import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Guild,
  GuildMember,
  MessageFlags,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { getDatabase } from "../database";
import { buildOrganizedContainer } from "./container";
import { cacheTicketMessage } from "./ticketMessageCache";
import { sendTicketCloseLog } from "./ticketCloseLog";

export const TICKET_CLOSE_ID = "ticket:close";
export const TICKET_OPEN_PREFIX = "ticket:open:";

export const TICKET_CATEGORIES = [
  { id: "suporte",      label: "Suporte",      motivo: "Suporte geral (Parceiras, Duvidas e Denuncias)" },
  { id: "verificacao",  label: "Verificacao",  motivo: "Relacionado ao Instagram" },
  { id: "recrutamento", label: "Recrutamento", motivo: "Candidatura ou contato com a equipe" },
] as const;

export type TicketCategoryId = (typeof TICKET_CATEGORIES)[number]["id"];

type TicketRecord = {
  channelId: string;
  userId: string;
  category: TicketCategoryId;
  createdAt: number;
};

function ensureTable() {
  getDatabase().exec(`
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

export function initTickets() {
  ensureTable();
}

export function getTicketCategory(id: string) {
  return TICKET_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function parseTicketOpenId(customId: string): TicketCategoryId | null {
  if (!customId.startsWith(TICKET_OPEN_PREFIX)) return null;
  const categoryId = customId.slice(TICKET_OPEN_PREFIX.length);
  return getTicketCategory(categoryId)?.id ?? null;
}

export function isTicketButton(customId: string) {
  return customId === TICKET_CLOSE_ID || parseTicketOpenId(customId) !== null;
}

export function getUserTicket(guildId: string, userId: string): TicketRecord | null {
  const row = getDatabase()
    .prepare(
      `SELECT channel_id as channelId, user_id as userId, category, created_at as createdAt
       FROM tickets WHERE guild_id = ? AND user_id = ?`
    )
    .get(guildId, userId) as TicketRecord | undefined;
  return row ?? null;
}

export function getTicketByChannel(channelId: string): TicketRecord | null {
  const row = getDatabase()
    .prepare(
      `SELECT channel_id as channelId, user_id as userId, category, created_at as createdAt
       FROM tickets WHERE channel_id = ?`
    )
    .get(channelId) as TicketRecord | undefined;
  return row ?? null;
}

function saveTicket(guildId: string, record: TicketRecord) {
  getDatabase()
    .prepare(
      `INSERT INTO tickets (guild_id, user_id, channel_id, category, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET
         channel_id = excluded.channel_id,
         category   = excluded.category,
         created_at = excluded.created_at`
    )
    .run(guildId, record.userId, record.channelId, record.category, record.createdAt);
}

export function removeTicket(guildId: string, userId: string) {
  getDatabase()
    .prepare(`DELETE FROM tickets WHERE guild_id = ? AND user_id = ?`)
    .run(guildId, userId);
}

function buildStaffOverwrites(guild: Guild) {
  const overwrites = [];
  for (const role of guild.roles.cache.values()) {
    if (role.id !== guild.id && role.permissions.has(PermissionFlagsBits.ManageChannels)) {
      overwrites.push({
        id: role.id,
        type: OverwriteType.Role,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }
  }
  return overwrites;
}

export function buildTicketPanelContainer() {
  const buttons = TICKET_CATEGORIES.map((category) =>
    new ButtonBuilder()
      .setCustomId(`${TICKET_OPEN_PREFIX}${category.id}`)
      .setLabel(category.label)
      .setStyle(ButtonStyle.Secondary)
  );

  return buildOrganizedContainer([
    "# **TICKET**",
    ["Selecione o tipo de atendimento abaixo.", "A equipe ira responder o mais rapido possivel."].join("\n"),
    TICKET_CATEGORIES.map((c) => `**${c.label}:** ${c.motivo}`).join("\n"),
  ]).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
  );
}

export function buildTicketChannelContainer(userId: string, categoryLabel: string, motivo: string) {
  return buildOrganizedContainer([
    "# **TICKET**",
    [
      `**Usuario:** <@${userId}>`,
      `**Categoria:** ${categoryLabel}`,
      `**Motivo:** ${motivo}`,
      `**Aberto em:** <t:${Math.floor(Date.now() / 1000)}:F>`,
    ].join("\n"),
    "A equipe ira responder em breve. Use o botao abaixo para fechar o ticket.",
  ]).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_CLOSE_ID)
        .setLabel("Fechar ticket")
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

export async function createTicketChannel(
  guild: Guild,
  member: GuildMember,
  categoryId: TicketCategoryId,
  motivo?: string,
  parentId?: string | null
): Promise<TextChannel> {
  const category = getTicketCategory(categoryId)!;
  const ticketMotivo = motivo ?? category.motivo;

  const channel = await guild.channels.create({
    name: `📑・${category.id}-${member.user.username}`.toLowerCase().replace(/[^a-z0-9-📑・]/gu, ""),
    type: ChannelType.GuildText,
    parent: parentId ?? undefined,
    permissionOverwrites: [
      { id: guild.id, type: OverwriteType.Role, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: guild.members.me!.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
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
    flags: MessageFlags.IsComponentsV2,
  });

  cacheTicketMessage(openingMessage);
  return channel;
}

export async function closeTicketChannel(
  guild: Guild,
  channel: TextChannel,
  ticket: TicketRecord,
  closedById: string
) {
  await sendTicketCloseLog(guild, channel, ticket, closedById);
  removeTicket(guild.id, ticket.userId);
  await channel.delete(`Ticket fechado por solicitacao`);
}
