import type { Client, VoiceState } from "discord.js";
export declare function initVoiceTime(): void;
export declare function formatVoiceDuration(ms: number): string;
export declare function getVoiceTime(guildId: string, userId: string): number;
export declare function getTopVoiceTimes(guildId: string, limit?: number): {
    userId: string;
    totalMs: number;
}[];
export declare function isInVoiceCall(guildId: string, userId: string): boolean;
export declare function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): void;
export declare function syncActiveVoiceSessions(client: Client): void;
//# sourceMappingURL=voiceTime.d.ts.map