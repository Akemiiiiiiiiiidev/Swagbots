"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTicketMessageCache = initTicketMessageCache;
exports.cacheTicketMessage = cacheTicketMessage;
exports.getCachedTicketMessages = getCachedTicketMessages;
exports.clearCachedTicketMessages = clearCachedTicketMessages;
const database_1 = require("../database");
const tickets_1 = require("./tickets");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_tag TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      PRIMARY KEY (channel_id, message_id)
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_messages_channel
    ON ticket_messages (channel_id, created_at);
  `);
}
function initTicketMessageCache() {
    ensureTable();
}
function extractMessageContent(message) {
    const parts = [];
    if (message.content) {
        parts.push(message.content);
    }
    const raw = message.toJSON();
    if (raw.components) {
        for (const component of raw.components) {
            if (component.type === 17 && component.components) {
                for (const inner of component.components) {
                    if (inner.type === 10 && inner.content) {
                        parts.push(inner.content);
                    }
                }
            }
        }
    }
    for (const component of message.components) {
        if ("components" in component) {
            for (const inner of component.components) {
                if (inner.content) {
                    parts.push(inner.content);
                }
            }
        }
    }
    return [...new Set(parts)].join("\n");
}
function cacheTicketMessage(message) {
    if (!message.guild)
        return;
    if (!(0, tickets_1.getTicketByChannel)(message.channel.id))
        return;
    initTicketMessageCache();
    const content = extractMessageContent(message);
    const attachments = [...message.attachments.values()]
        .map((file) => `${file.name}: ${file.url}`)
        .join("\n");
    (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO ticket_messages (
      channel_id, message_id, author_id, author_tag, content, attachments, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(channel_id, message_id) DO UPDATE SET
      content = excluded.content,
      attachments = excluded.attachments
  `)
        .run(message.channel.id, message.id, message.author.id, message.author.tag, content, attachments, message.createdTimestamp);
}
function getCachedTicketMessages(channelId) {
    initTicketMessageCache();
    return (0, database_1.getDatabase)()
        .prepare(`
    SELECT
      message_id as messageId,
      author_id as authorId,
      author_tag as authorTag,
      content,
      attachments,
      created_at as createdAt
    FROM ticket_messages
    WHERE channel_id = ?
    ORDER BY created_at ASC
  `)
        .all(channelId);
}
function clearCachedTicketMessages(channelId) {
    initTicketMessageCache();
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM ticket_messages WHERE channel_id = ?`)
        .run(channelId);
}
//# sourceMappingURL=ticketMessageCache.js.map