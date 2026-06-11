"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTicketTranscript = buildTicketTranscript;
exports.buildTranscriptAttachment = buildTranscriptAttachment;
const discord_js_1 = require("discord.js");
const ticketMessageCache_1 = require("./ticketMessageCache");
const tickets_1 = require("./tickets");
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
    if (message.attachments.size > 0) {
        for (const file of message.attachments.values()) {
            parts.push(`[Anexo: ${file.name} - ${file.url}]`);
        }
    }
    if (message.embeds.length > 0) {
        for (const embed of message.embeds) {
            if (embed.title || embed.description) {
                parts.push(`[Embed: ${[embed.title, embed.description].filter(Boolean).join(" - ")}]`);
            }
        }
    }
    return [...new Set(parts)].join("\n");
}
function formatCachedLine(authorTag, authorId, content, attachments, createdAt) {
    const time = new Date(createdAt).toLocaleString("pt-BR");
    const parts = [];
    if (content.trim()) {
        parts.push(content.trim());
    }
    if (attachments.trim()) {
        for (const line of attachments.split("\n")) {
            parts.push(`[Anexo: ${line}]`);
        }
    }
    if (parts.length === 0) {
        parts.push("[Sem conteudo]");
    }
    return `[${time}] ${authorTag} (${authorId}):\n${parts.join("\n")}`;
}
function formatMessageLine(message) {
    const content = extractMessageContent(message);
    return formatCachedLine(message.author.tag, message.author.id, content, "", message.createdTimestamp);
}
async function buildTicketTranscript(channel, ticket, closedById) {
    const cached = (0, ticketMessageCache_1.getCachedTicketMessages)(channel.id);
    let lines = [];
    if (cached.length > 0) {
        lines = cached.map((entry) => formatCachedLine(entry.authorTag, entry.authorId, entry.content, entry.attachments, entry.createdAt));
    }
    else {
        const allMessages = [];
        let lastId;
        while (true) {
            const fetched = await channel.messages.fetch({
                limit: 100,
                before: lastId,
            });
            if (fetched.size === 0)
                break;
            allMessages.push(...fetched.values());
            lastId = fetched.last().id;
            if (fetched.size < 100)
                break;
        }
        allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        lines = allMessages.map(formatMessageLine);
    }
    const category = (0, tickets_1.getTicketCategory)(ticket.category);
    const header = [
        "RELATORIO DO TICKET",
        "========================",
        `Canal: ${channel.name}`,
        `ID do canal: ${channel.id}`,
        `Usuario: ${ticket.userId}`,
        `Categoria: ${category?.label ?? ticket.category}`,
        `Aberto em: ${new Date(ticket.createdAt).toLocaleString("pt-BR")}`,
        `Fechado por: ${closedById}`,
        `Fechado em: ${new Date().toLocaleString("pt-BR")}`,
        `Total de mensagens: ${lines.length}`,
        "========================",
        "",
    ].join("\n");
    const body = lines.length > 0
        ? lines.join("\n\n")
        : "Nenhuma mensagem registrada neste ticket.";
    (0, ticketMessageCache_1.clearCachedTicketMessages)(channel.id);
    return {
        text: `${header}${body}`,
        messageCount: lines.length,
    };
}
function buildTranscriptAttachment(channelName, transcript) {
    const safeName = channelName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const fileName = `relatorio-${safeName}-${Date.now()}.txt`;
    return new discord_js_1.AttachmentBuilder(Buffer.from(transcript, "utf-8"), {
        name: fileName,
    });
}
//# sourceMappingURL=ticketTranscript.js.map