"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWelcome = initWelcome;
exports.setWelcomeConfig = setWelcomeConfig;
exports.getWelcomeConfig = getWelcomeConfig;
exports.clearWelcomeConfig = clearWelcomeConfig;
exports.getWelcomePlaceholderHelp = getWelcomePlaceholderHelp;
exports.formatWelcomeMessage = formatWelcomeMessage;
exports.sendWelcomeMessage = sendWelcomeMessage;
const discord_js_1 = require("discord.js");
const database_1 = require("../database");
const PLACEHOLDER_HELP = [
    "**Placeholders disponiveis:**",
    "`{usuario}` - mencao do membro",
    "`{servidor}` - nome do servidor",
    "`{membros}` - total de membros",
].join("\n");
function ensureTable() {
    (0, database_1.getDatabase)().exec(`
    CREATE TABLE IF NOT EXISTS welcome_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL
    );
  `);
}
function initWelcome() {
    ensureTable();
}
function setWelcomeConfig(guildId, channelId, message) {
    initWelcome();
    (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO welcome_config (guild_id, channel_id, message)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      message = excluded.message
  `)
        .run(guildId, channelId, message);
}
function getWelcomeConfig(guildId) {
    initWelcome();
    const row = (0, database_1.getDatabase)()
        .prepare(`
    SELECT channel_id as channelId, message
    FROM welcome_config
    WHERE guild_id = ?
  `)
        .get(guildId);
    return row ?? null;
}
function clearWelcomeConfig(guildId) {
    initWelcome();
    (0, database_1.getDatabase)()
        .prepare(`DELETE FROM welcome_config WHERE guild_id = ?`)
        .run(guildId);
}
function getWelcomePlaceholderHelp() {
    return PLACEHOLDER_HELP;
}
function formatWelcomeMessage(template, guild, userId) {
    return template
        .replaceAll("{usuario}", `<@${userId}>`)
        .replaceAll("{user}", `<@${userId}>`)
        .replaceAll("{servidor}", guild.name)
        .replaceAll("{server}", guild.name)
        .replaceAll("{membros}", String(guild.memberCount));
}
async function sendWelcomeMessage(member) {
    const config = getWelcomeConfig(member.guild.id);
    if (!config)
        return;
    const channel = member.guild.channels.cache.get(config.channelId) ??
        (await member.guild.channels.fetch(config.channelId).catch(() => null));
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const textChannel = channel;
    const botMember = member.guild.members.me;
    if (!botMember)
        return;
    if (!textChannel.permissionsFor(botMember)?.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
        console.warn(`Sem permissao para enviar boas-vindas em ${textChannel.id} (${member.guild.id})`);
        return;
    }
    const content = formatWelcomeMessage(config.message, member.guild, member.id);
    await textChannel.send({ content });
}
//# sourceMappingURL=welcome.js.map