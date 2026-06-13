import {
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
} from "@discordjs/builders";
import {
  MessageFlags,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type MessageCreateOptions,
} from "discord.js";

const BLACK = 0x000000;
const PINK  = 0xFF0066;

export const E = "<:1supra_white:1514705873627381840>";
export const V = "<a:Verified:1514716584407470252>";
export const U = "<:xxx:1514705761413107732>";

// ── Tipos para o formato de lista hierárquica ──────────────────────────────
export interface ListSection {
  /** Título da seção, ex: "👤 Usuário" */
  label: string;
  /** Items da seção. Cada item aparece como sub-bullet */
  items: string[];
}

/**
 * Constrói um container no estilo da imagem de referência:
 *
 *   **Título**
 *   - **👤 Label:**
 *     - item1
 *     - item2
 *   - **🔄 Label2:**
 *     - item1
 */
export function buildListContainer(
  title: string,
  sections: ListSection[]
): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(PINK);

  // Título
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`## ${title}`)
  );

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Separador antes de cada seção
    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    // Label + items em bloco único
    const lines: string[] = [`- **${section.label}:**`];
    for (const item of section.items) {
      lines.push(`  - ${item}`);
    }

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join("\n"))
    );
  }

  return container;
}

function buildContainer(text: string): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(PINK)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

export function buildOrganizedContainer(sections: string[]): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(PINK);

  sections.forEach((section, index) => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(section)
    );

    if (index < sections.length - 1) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
      );
    }
  });

  return container;
}

// allowedMentions globais — mostra o nome clicável mas NÃO notifica ninguém
const NO_MENTIONS = { parse: [] as [] };

export function containerMessage(sections: string[]): MessageCreateOptions {
  return {
    components: [buildOrganizedContainer(sections)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: NO_MENTIONS,
  };
}

export function containerReply(
  text: string,
  options?: { ephemeral?: boolean }
): InteractionReplyOptions {
  const flags = options?.ephemeral
    ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral)
    : MessageFlags.IsComponentsV2;

  return {
    components: [buildContainer(text)],
    flags: flags as InteractionReplyOptions["flags"],
    allowedMentions: NO_MENTIONS,
  };
}

export function containerEdit(text: string): InteractionEditReplyOptions {
  return {
    components: [buildContainer(text)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: NO_MENTIONS,
  };
}

export function containerEditOrganized(
  sections: string[]
): InteractionEditReplyOptions {
  return {
    components: [buildOrganizedContainer(sections)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: NO_MENTIONS,
  };
}

export function containerReplyOrganized(
  sections: string[],
  options?: { ephemeral?: boolean }
): InteractionReplyOptions {
  const flags = options?.ephemeral
    ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral)
    : MessageFlags.IsComponentsV2;

  return {
    components: [buildOrganizedContainer(sections)],
    flags: flags as InteractionReplyOptions["flags"],
    allowedMentions: NO_MENTIONS,
  };
}

// ── Funções para o formato de lista hierárquica ────────────────────────────

export function containerReplyList(
  title: string,
  sections: ListSection[],
  options?: { ephemeral?: boolean }
): InteractionReplyOptions {
  const flags = options?.ephemeral
    ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral)
    : MessageFlags.IsComponentsV2;

  return {
    components: [buildListContainer(title, sections)],
    flags: flags as InteractionReplyOptions["flags"],
    allowedMentions: NO_MENTIONS,
  };
}

export function containerEditList(
  title: string,
  sections: ListSection[]
): InteractionEditReplyOptions {
  return {
    components: [buildListContainer(title, sections)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: NO_MENTIONS,
  };
}

export function containerMessageList(
  title: string,
  sections: ListSection[]
): MessageCreateOptions {
  return {
    components: [buildListContainer(title, sections)],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: NO_MENTIONS,
  };
}
