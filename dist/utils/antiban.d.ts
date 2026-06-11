import { GuildMember } from "discord.js";
export declare function initAntiban(): void;
export declare function setAntiban(guildId: string, roleId: string): void;
export declare function getAntibanRoleId(guildId: string): string | null;
export declare function clearAntiban(guildId: string): void;
export declare function isAntibanProtected(member: GuildMember): boolean;
//# sourceMappingURL=antiban.d.ts.map