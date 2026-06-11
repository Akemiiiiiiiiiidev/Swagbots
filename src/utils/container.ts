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
