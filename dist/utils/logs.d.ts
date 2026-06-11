import { ChatInputCommandInteraction, Guild, VoiceState } from "discord.js";
export declare const LOG_TYPES: {
    readonly comandos: {
        readonly channel: "🖤・logs-comandos";
        readonly title: "COMANDO";
    };
    readonly ban: {
        readonly channel: "🖤・logs-ban";
        readonly title: "BANIMENTO";
    };
    readonly mute: {
        readonly channel: "🖤・logs-mute";
        readonly title: "SILENCIAMENTO";
    };
    readonly call: {
        readonly channel: "🖤・logs-call";
        readonly title: "CALL";
    };
    readonly cargo: {
        readonly channel: "🖤・logs-cargo";
        readonly title: "CARGO";
    };
    readonly ticket: {
        readonly channel: "🖤・logs-ticket";
        readonly title: "TICKET";
    };
};
export type LogType = keyof typeof LOG_TYPES;
export declare function initLogs(): void;
export declare function getLogChannelId(guildId: string, logType: LogType): string | null;
export declare function setupLogChannels(guild: Guild): Promise<string[]>;
export declare function sendLogWithFiles(guild: Guild, logType: LogType, sections: string[], files: {
    attachment: Buffer | string;
    name: string;
}[]): Promise<void>;
export declare function sendLog(guild: Guild, logType: LogType, sections: string[]): Promise<void>;
export declare function logCommand(interaction: ChatInputCommandInteraction): Promise<void>;
export declare function logVoiceStateChange(oldState: VoiceState, newState: VoiceState): Promise<void>;
//# sourceMappingURL=logs.d.ts.map