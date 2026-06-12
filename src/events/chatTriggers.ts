import { Client } from "discord.js";

// MessageContent intent nao esta ativa — triggers de texto desativados.
// Os comandos de PD sao gerenciados via slash commands (/pd e /pd config).
export function registerChatTriggers(_client: Client) {
  // sem triggers ativos no momento
}
