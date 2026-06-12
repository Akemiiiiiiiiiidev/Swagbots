export type ProtectionSystem = "anti_link" | "channel_protection";
export declare function initProtection(): void;
export declare function setProtection(guildId: string, system: ProtectionSystem, enabled: boolean): void;
export declare function isProtectionEnabled(guildId: string, system: ProtectionSystem): boolean;
//# sourceMappingURL=protection.d.ts.map