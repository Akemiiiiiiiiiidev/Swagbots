"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTicketCloseLog = sendTicketCloseLog;
const logs_1 = require("./logs");
const ticketTranscript_1 = require("./ticketTranscript");
const tickets_1 = require("./tickets");
async function sendTicketCloseLog(guild, channel, ticket, closedById) {
    const category = (0, tickets_1.getTicketCategory)(ticket.category);
    const { text, messageCount } = await (0, ticketTranscript_1.buildTicketTranscript)(channel, ticket, closedById);
    const attachment = (0, ticketTranscript_1.buildTranscriptAttachment)(channel.name, text);
    const chatLines = text.split("========================\n").pop() ?? "";
    const preview = messageCount > 0
        ? chatLines.split("\n\n").slice(0, 4).join("\n\n").slice(0, 800)
        : "Nenhuma mensagem registrada.";
    await (0, logs_1.sendLogWithFiles)(guild, "ticket", [
        [
            "**Ticket fechado**",
            `**Usuario:** <@${ticket.userId}>`,
            `**Canal:** #${channel.name}`,
            `**Categoria:** ${category?.label ?? ticket.category}`,
            `**Fechado por:** <@${closedById}>`,
            `**Mensagens no chat:** ${messageCount}`,
            `**Aberto em:** <t:${Math.floor(ticket.createdAt / 1000)}:F>`,
            `**Fechado em:** <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join("\n"),
        ["**Preview do chat**", `\`\`\`\n${preview}\n\`\`\``].join("\n"),
    ], [
        {
            attachment: Buffer.from(text, "utf-8"),
            name: attachment.name ?? "relatorio-ticket.txt",
        },
    ]);
}
//# sourceMappingURL=ticketCloseLog.js.map