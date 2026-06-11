import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { commands } from "./commands";
import { initDatabase } from "./database";
import {
  blacklistIntents,
  registerBlacklistProtection,
} from "./events/blacklistProtection";
import { registerAutoRole } from "./events/autoRole";
import { registerChatTriggers } from "./events/chatTriggers";
import {
  handleInstagramButton,
  handleInstagramModal,
  initInstagramSystem,
} from "./events/instagramInteractions";
import { registerInstagramMessages } from "./events/instagramMessages";
import { registerMessageCounter } from "./events/messageCounter";
import { registerTicketMessageCache } from "./events/ticketMessageCache";
import { registerWelcome } from "./events/welcome";
import { handleVoiceLogs } from "./events/voiceLogs";
import {
  handleTicketButton,
  initTicketSystem,
} from "./events/ticketInteractions";
import { registerGuildSetup } from "./events/guildSetup";
import { registerRoleProtection } from "./events/roleProtection";
import { registerColeiraVoice } from "./events/coleira";
import { registerSetarCargoProtection } from "./events/setarCargoProtection";
import type { Command } from "./types";
import { containerEdit, containerReply } from "./utils/container";
import { initAutoRole } from "./utils/autoRole";
import { initAntiban } from "./utils/antiban";
import { initWelcome } from "./utils/welcome";
import { initLogs, logCommand } from "./utils/logs";
import { startWeeklyResetScheduler } from "./utils/messageCount";
import { initColeira } from "./utils/coleira";
import { initSetarCargo } from "./utils/setarCargo";
import { initRoleProtection } from "./utils/roleProtection";
import {
  handleVoiceStateUpdate,
  initVoiceTime,
  syncActiveVoiceSessions,
} from "./utils/voiceTime";

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
    console.error(
      `https://discord.com/developers/applications/${clientId}/bot`
    );
  } else {
    console.error("https://discord.com/developers/applications");
  }
  console.error("Bot > Privileged Gateway Intents > MESSAGE CONTENT INTENT");
}

initDatabase();
initAutoRole();
initAntiban();
initWelcome();
initLogs();
initVoiceTime();
initTicketSystem();
initInstagramSystem();
initColeira();
initSetarCargo();
initRoleProtection();
startWeeklyResetScheduler();

const client = new Client({
  intents: [
    ...blacklistIntents,
    GatewayIntentBits.GuildMembers,
  ],
});

registerBlacklistProtection(client);
registerAutoRole(client);
registerWelcome(client);
registerMessageCounter(client);
registerTicketMessageCache(client);
registerInstagramMessages(client);
registerChatTriggers(client);
registerGuildSetup(client);
registerRoleProtection(client);
registerColeiraVoice(client);
registerSetarCargoProtection(client);

const commandMap = new Collection<string, Command>();

for (const command of commands) {
  commandMap.set(command.data.name, command);
}

function isInteractionExpired(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const code = (error as { code: number }).code;
  return code === 10062 || code === 40060;
}

client.once(Events.ClientReady, (readyClient) => {
  syncActiveVoiceSessions(readyClient);
  console.log(`Bot online como ${readyClient.user.tag}`);
  console.log(
    `Comandos carregados: ${[...commandMap.keys()].map((name) => `/${name}`).join(", ")}`
  );
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  handleVoiceStateUpdate(oldState, newState);
  handleVoiceLogs(oldState, newState).catch((error) => {
    console.error("Erro ao registrar log de call:", error);
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      const instagramHandled = await handleInstagramButton(interaction);
      if (instagramHandled) return;

      const handled = await handleTicketButton(interaction);
      if (handled) return;
    } catch (error) {
      console.error("Erro ao processar botao:", error);
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    try {
      const handled = await handleInstagramModal(interaction);
      if (handled) return;
    } catch (error) {
      console.error("Erro ao processar modal:", error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);

  if (!command) {
    console.warn(`Comando desconhecido: ${interaction.commandName}`);
    return;
  }

  try {
    if (
      command.defer &&
      interaction.inGuild() &&
      !interaction.deferred &&
      !interaction.replied
    ) {
      await interaction.deferReply();
    }

    console.log(`/${interaction.commandName} usado por ${interaction.user.tag}`);
    await command.execute(interaction);

    if (interaction.inGuild()) {
      logCommand(interaction).catch((error) => {
        console.error("Erro ao registrar log de comando:", error);
      });
    }

    // Auto-delete: apaga a resposta do comando após 4 segundos
    // Ignora respostas efêmeras (só visíveis para o usuário — não podem ser deletadas pelo bot)
    if (interaction.inGuild() && (interaction.replied || interaction.deferred)) {
      try {
        const reply = await interaction.fetchReply();
        const isEphemeral = reply.flags.has(MessageFlags.Ephemeral);
        console.log(`[auto-delete] /${interaction.commandName} | replied=${interaction.replied} deferred=${interaction.deferred} ephemeral=${isEphemeral} messageId=${reply.id}`);
        if (!isEphemeral) {
          setTimeout(() => {
            reply.delete().then(() => {
              console.log(`[auto-delete] /${interaction.commandName} deletado com sucesso`);
            }).catch((err) => {
              console.error(`[auto-delete] erro ao deletar /${interaction.commandName}:`, err);
            });
          }, 4000);
        }
      } catch (err) {
        console.error(`[auto-delete] erro ao buscar reply de /${interaction.commandName}:`, err);
      }
    }
  } catch (error) {
    if (isInteractionExpired(error)) {
      console.error(
        `Interação expirada em /${interaction.commandName}. Verifique se há mais de uma instância do bot rodando.`
      );
      return;
    }

    console.error(`Erro ao executar /${interaction.commandName}:`, error);

    const message = "Ocorreu um erro ao executar este comando.";

    try {
      if (interaction.deferred) {
        await interaction.editReply(containerEdit(message));
      } else if (interaction.replied) {
        await interaction.followUp(
          containerReply(message, { ephemeral: true })
        );
      } else {
        await interaction.reply(containerReply(message, { ephemeral: true }));
      }
    } catch (replyError) {
      if (!isInteractionExpired(replyError)) {
        console.error("Não foi possível responder à interação:", replyError);
      }
    }
  }
});

client.on(Events.Error, (error) => {
  if (error.message.includes("Used disallowed intents")) {
    printPrivilegedIntentHelp();
    process.exit(1);
  }

  console.error("Erro no cliente Discord:", error);
});

client.login(token).catch((error: Error) => {
  if (error.message.includes("Used disallowed intents")) {
    printPrivilegedIntentHelp();
  } else {
    console.error("Erro ao conectar o bot:", error);
  }

  process.exit(1);
});
