import { Client, GatewayIntentBits } from "discord.js";
export declare function registerBlacklistProtection(client: Client): void;
export declare const botIntents: readonly [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent];
export declare function getBotIntents(): (GatewayIntentBits.Guilds | GatewayIntentBits.GuildModeration | GatewayIntentBits.GuildVoiceStates | GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent)[];
export declare const blacklistIntents: (GatewayIntentBits.Guilds | GatewayIntentBits.GuildModeration | GatewayIntentBits.GuildVoiceStates | GatewayIntentBits.GuildMessages | GatewayIntentBits.MessageContent)[];
//# sourceMappingURL=blacklistProtection.d.ts.map