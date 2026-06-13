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
  const lines: string[] = [`## ${title}`];

  for (const section of sections) {
    lines.push(`- **${section.label}:**`);
    for (const item of section.items) {
      lines.push(`  - ${item}`);
    }
  }

  return new ContainerBuilder()
    .setAccentColor(BLACK)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(lines.join("\n"))
    );
}

function buildContainer(text: string): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(BLACK)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

export function buildOrganizedContainer(sections: string[]): ContainerBuilder {
  const container = new ContainerBuilder().setAccentColor(BLACK);

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

export function containerMessage(sections: string[]): MessageCreateOptions {
  return {
    components: [buildOrganizedContainer(sections)],
    flags: MessageFlags.IsComponentsV2,
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
  };
}

export function containerEdit(text: string): InteractionEditReplyOptions {
  return {
    components: [buildContainer(text)],
    flags: MessageFlags.IsComponentsV2,
  };
}

export function containerEditOrganized(
  sections: string[]
): InteractionEditReplyOptions {
  return {
    components: [buildOrganizedContainer(sections)],
    flags: MessageFlags.IsComponentsV2,
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
  };
}

export function containerEditList(
  title: string,
  sections: ListSection[]
): InteractionEditReplyOptions {
  return {
    components: [buildListContainer(title, sections)],
    flags: MessageFlags.IsComponentsV2,
  };
}

export function containerMessageList(
  title: string,
  sections: ListSection[]
): MessageCreateOptions {
  return {
    components: [buildListContainer(title, sections)],
    flags: MessageFlags.IsComponentsV2,
  };
}
