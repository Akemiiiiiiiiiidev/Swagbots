import { Client, GatewayIntentBits } from "discord.js";
export declare function registerBlacklistProtection(client: Client): void;
export declare const botIntents: readonly [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages];
export declare function getBotIntents(): GatewayIntentBits[];
export declare const blacklistIntents: GatewayIntentBits[];
//# sourceMappingURL=blacklistProtection.d.ts.map