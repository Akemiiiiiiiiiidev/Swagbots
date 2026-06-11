import { AttachmentBuilder, Message, TextChannel } from "discord.js";
import {
  clearCachedTicketMessages,
  getCachedTicketMessages,
} from "./ticketMessageCache";
import { getTicketCategory } from "./tickets";

type TicketInfo = {
  userId: string;
  category: string;
  createdAt: number;
};

function extractMessageContent(message: Message): string {
  const parts: string[] = [];

  if (message.content) {
    parts.push(message.content);
  }

  const raw = message.toJSON() as {
    content?: string;
    components?: {
      type: number;
      components?: { type: number; content?: string }[];
    }[];
  };

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
      for (const inner of component.components as { content?: string }[]) {
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
        parts.push(
          `[Embed: ${[embed.title, embed.description].filter(Boolean).join(" - ")}]`
        );
      }
    }
  }

  return [...new Set(parts)].join("\n");
}

function formatCachedLine(
  authorTag: string,
  authorId: string,
  content: string,
  attachments: string,
  createdAt: number
): string {
  const time = new Date(createdAt).toLocaleString("pt-BR");
  const parts: string[] = [];

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

function formatMessageLine(message: Message): string {
  const content = extractMessageContent(message);

  return formatCachedLine(
    message.author.tag,
    message.author.id,
    content,
    "",
    message.createdTimestamp
  );
}

export async function buildTicketTranscript(
  channel: TextChannel,
  ticket: TicketInfo,
  closedById: string
): Promise<{ text: string; messageCount: number }> {
  const cached = getCachedTicketMessages(channel.id);

  let lines: string[] = [];

  if (cached.length > 0) {
    lines = cached.map((entry) =>
      formatCachedLine(
        entry.authorTag,
        entry.authorId,
        entry.content,
        entry.attachments,
        entry.createdAt
      )
    );
  } else {
    const allMessages: Message[] = [];
    let lastId: string | undefined;

    while (true) {
      const fetched = await channel.messages.fetch({
        limit: 100,
        before: lastId,
      });

      if (fetched.size === 0) break;

      allMessages.push(...fetched.values());
      lastId = fetched.last()!.id;

      if (fetched.size < 100) break;
    }

    allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    lines = allMessages.map(formatMessageLine);
  }

  const category = getTicketCategory(ticket.category);

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

  const body =
    lines.length > 0
      ? lines.join("\n\n")
      : "Nenhuma mensagem registrada neste ticket.";

  clearCachedTicketMessages(channel.id);

  return {
    text: `${header}${body}`,
    messageCount: lines.length,
  };
}

export function buildTranscriptAttachment(
  channelName: string,
  transcript: string
) {
  const safeName = channelName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const fileName = `relatorio-${safeName}-${Date.now()}.txt`;

  return new AttachmentBuilder(Buffer.from(transcript, "utf-8"), {
    name: fileName,
  });
}
