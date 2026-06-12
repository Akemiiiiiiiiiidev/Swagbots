"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
const database_1 = require("./database");
const blacklistProtection_1 = require("./events/blacklistProtection");
const autoRole_1 = require("./events/autoRole");
const chatTriggers_1 = require("./events/chatTriggers");
const instagramInteractions_1 = require("./events/instagramInteractions");
const instagramMessages_1 = require("./events/instagramMessages");
const messageCounter_1 = require("./events/messageCounter");
const ticketMessageCache_1 = require("./events/ticketMessageCache");
const welcome_1 = require("./events/welcome");
const voiceLogs_1 = require("./events/voiceLogs");
const ticketInteractions_1 = require("./events/ticketInteractions");
const pdInteractions_1 = require("./events/pdInteractions");
const guildSetup_1 = require("./events/guildSetup");
const roleProtection_1 = require("./events/roleProtection");
const coleira_1 = require("./events/coleira");
const setarCargoProtection_1 = require("./events/setarCargoProtection");
const antiLink_1 = require("./events/antiLink");
const channelProtection_1 = require("./events/channelProtection");
const container_1 = require("./utils/container");
const autoRole_2 = require("./utils/autoRole");
const antiban_1 = require("./utils/antiban");
const welcome_2 = require("./utils/welcome");
const logs_1 = require("./utils/logs");
const messageCount_1 = require("./utils/messageCount");
const coleira_2 = require("./utils/coleira");
const setarCargo_1 = require("./utils/setarCargo");
const roleProtection_2 = require("./utils/roleProtection");
const pd_1 = require("./utils/pd");
const voiceTime_1 = require("./utils/voiceTime");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
if (!token) {
    console.error("Defina DISCORD_TOKEN no arquivo .env");
    process.exit(1);
}
function printPrivilegedIntentHelp() {
    console.error("\nErro: intents privilegiadas nao habilitadas no portal do Discord.");
    console.error("Opcao 1: remova MESSAGE_CONTENT_INTENT=true do .env");
    console.error("Opcao 2: ative Message Content Intent em:");
    if (clientId) {
        console.error(`https://discord.com/developers/applications/${clientId}/bot`);
    }
    else {
        console.error("https://discord.com/developers/applications");
    }
    console.error("Bot > Privileged Gateway Intents > MESSAGE CONTENT INTENT");
}
(0, database_1.initDatabase)();
(0, autoRole_2.initAutoRole)();
(0, antiban_1.initAntiban)();
(0, welcome_2.initWelcome)();
(0, logs_1.initLogs)();
(0, voiceTime_1.initVoiceTime)();
(0, ticketInteractions_1.initTicketSystem)();
(0, instagramInteractions_1.initInstagramSystem)();
(0, coleira_2.initColeira)();
(0, setarCargo_1.initSetarCargo)();
(0, roleProtection_2.initRoleProtection)();
(0, pd_1.initPd)();
(0, messageCount_1.startWeeklyResetScheduler)();
const client = new discord_js_1.Client({
    intents: [
        ...blacklistProtection_1.blacklistIntents,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
(0, blacklistProtection_1.registerBlacklistProtection)(client);
(0, autoRole_1.registerAutoRole)(client);
(0, welcome_1.registerWelcome)(client);
(0, messageCounter_1.registerMessageCounter)(client);
(0, ticketMessageCache_1.registerTicketMessageCache)(client);
(0, instagramMessages_1.registerInstagramMessages)(client);
(0, chatTriggers_1.registerChatTriggers)(client);
(0, guildSetup_1.registerGuildSetup)(client);
(0, roleProtection_1.registerRoleProtection)(client);
(0, coleira_1.registerColeiraVoice)(client);
(0, setarCargoProtection_1.registerSetarCargoProtection)(client);
(0, antiLink_1.registerAntiLink)(client);
(0, channelProtection_1.registerChannelProtection)(client);
const commandMap = new discord_js_1.Collection();
for (const command of commands_1.commands) {
    commandMap.set(command.data.name, command);
}
function isInteractionExpired(error) {
    if (!error || typeof error !== "object" || !("code" in error)) {
        return false;
    }
    const code = error.code;
    return code === 10062 || code === 40060;
}
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    (0, voiceTime_1.syncActiveVoiceSessions)(readyClient);
    console.log(`Bot online como ${readyClient.user.tag}`);
    console.log(`Comandos carregados: ${[...commandMap.keys()].map((name) => `/${name}`).join(", ")}`);
});
client.on(discord_js_1.Events.VoiceStateUpdate, (oldState, newState) => {
    (0, voiceTime_1.handleVoiceStateUpdate)(oldState, newState);
    (0, voiceLogs_1.handleVoiceLogs)(oldState, newState).catch((error) => {
        console.error("Erro ao registrar log de call:", error);
    });
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        try {
            const pdHandled = await (0, pdInteractions_1.handlePdButton)(interaction);
            if (pdHandled)
                return;
            const instagramHandled = await (0, instagramInteractions_1.handleInstagramButton)(interaction);
            if (instagramHandled)
                return;
            const handled = await (0, ticketInteractions_1.handleTicketButton)(interaction);
            if (handled)
                return;
        }
        catch (error) {
            console.error("Erro ao processar botao:", error);
        }
        return;
    }
    if (interaction.isRoleSelectMenu()) {
        try {
            const pdHandled = await (0, pdInteractions_1.handlePdRoleSelect)(interaction);
            if (pdHandled)
                return;
        }
        catch (error) {
            console.error("Erro ao processar role select:", error);
        }
        return;
    }
    if (interaction.isModalSubmit()) {
        try {
            const pdHandled = await (0, pdInteractions_1.handlePdModal)(interaction);
            if (pdHandled)
                return;
            const handled = await (0, instagramInteractions_1.handleInstagramModal)(interaction);
            if (handled)
                return;
        }
        catch (error) {
            console.error("Erro ao processar modal:", error);
        }
        return;
    }
    if (!interaction.isChatInputCommand())
        return;
    const command = commandMap.get(interaction.commandName);
    if (!command) {
        console.warn(`Comando desconhecido: ${interaction.commandName}`);
        return;
    }
    try {
        if (command.defer &&
            interaction.inGuild() &&
            !interaction.deferred &&
            !interaction.replied) {
            await interaction.deferReply();
        }
        console.log(`/${interaction.commandName} usado por ${interaction.user.tag}`);
        await command.execute(interaction);
        if (interaction.inGuild()) {
            (0, logs_1.logCommand)(interaction).catch((error) => {
                console.error("Erro ao registrar log de comando:", error);
            });
        }
        // Auto-delete: apaga a resposta do comando após 4 segundos
        // Ignora respostas efêmeras e comandos com noAutoDelete: true
        if (interaction.inGuild() && (interaction.replied || interaction.deferred) && !command.noAutoDelete) {
            try {
                const reply = await interaction.fetchReply();
                const isEphemeral = reply.flags.has(discord_js_1.MessageFlags.Ephemeral);
                if (!isEphemeral) {
                    setTimeout(() => {
                        reply.delete().catch(() => {
                            // Ignora erros (mensagem já deletada, interação expirada, etc.)
                        });
                    }, 4000);
                }
            }
            catch {
                // Ignora erros ao buscar a resposta
            }
        }
    }
    catch (error) {
        if (isInteractionExpired(error)) {
            console.error(`Interação expirada em /${interaction.commandName}. Verifique se há mais de uma instância do bot rodando.`);
            return;
        }
        console.error(`Erro ao executar /${interaction.commandName}:`, error);
        const message = "Ocorreu um erro ao executar este comando.";
        try {
            if (interaction.deferred) {
                await interaction.editReply((0, container_1.containerEdit)(message));
            }
            else if (interaction.replied) {
                await interaction.followUp((0, container_1.containerReply)(message, { ephemeral: true }));
            }
            else {
                await interaction.reply((0, container_1.containerReply)(message, { ephemeral: true }));
            }
        }
        catch (replyError) {
            if (!isInteractionExpired(replyError)) {
                console.error("Não foi possível responder à interação:", replyError);
            }
        }
    }
});
client.on(discord_js_1.Events.Error, (error) => {
    if (error.message.includes("Used disallowed intents")) {
        printPrivilegedIntentHelp();
        process.exit(1);
    }
    console.error("Erro no cliente Discord:", error);
});
client.login(token).catch((error) => {
    if (error.message.includes("Used disallowed intents")) {
        printPrivilegedIntentHelp();
    }
    else {
        console.error("Erro ao conectar o bot:", error);
    }
    process.exit(1);
});
//# sourceMappingURL=index.js.map