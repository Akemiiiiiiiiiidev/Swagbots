import { ContainerBuilder } from "@discordjs/builders";
import { type InteractionEditReplyOptions, type InteractionReplyOptions, type MessageCreateOptions } from "discord.js";
export declare const E = "<:1supra_white:1514705873627381840>";
export declare const V = "<a:Verified:1514716584407470252>";
export declare function buildOrganizedContainer(sections: string[]): ContainerBuilder;
export declare function containerMessage(sections: string[]): MessageCreateOptions;
export declare function containerReply(text: string, options?: {
    ephemeral?: boolean;
}): InteractionReplyOptions;
export declare function containerEdit(text: string): InteractionEditReplyOptions;
export declare function containerEditOrganized(sections: string[]): InteractionEditReplyOptions;
export declare function containerReplyOrganized(sections: string[], options?: {
    ephemeral?: boolean;
}): InteractionReplyOptions;
//# sourceMappingURL=container.d.ts.map