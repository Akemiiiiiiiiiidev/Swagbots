import { Guild, TextChannel } from "discord.js";
import { sendLogWithFiles } from "./logs";
import {
  buildTicketTranscript,
  buildTranscriptAttachment,
} from "./ticketTranscript";
import { getTicketCategory } from "./tickets";

type TicketRecord = {
  userId: string;
  category: string;
  createdAt: number;
};

export async function sendTicketCloseLog(
  guild: Guild,
  channel: TextChannel,
  ticket: TicketRecord,
  closedById: string
) {
  const category = getTicketCategory(ticket.category);
  const { text, messageCount } = await buildTicketTranscript(
    channel,
    ticket,
    closedById
  );

  const attachment = buildTranscriptAttachment(channel.name, text);
  const chatLines = text.split("========================\n").pop() ?? "";
  const preview =
    messageCount > 0
      ? chatLines.split("\n\n").slice(0, 4).join("\n\n").slice(0, 800)
      : "Nenhuma mensagem registrada.";

  await sendLogWithFiles(
    guild,
    "ticket",
    [
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
    ],
    [
      {
        attachment: Buffer.from(text, "utf-8"),
        name: attachment.name ?? "relatorio-ticket.txt",
      },
    ]
  );
}
