import { Client, Events, Guild } from "discord.js";
import { setupLogChannels } from "../utils/logs";

async function handleGuildCreate(guild: Guild) {
  console.log(`Bot adicionado ao servidor: ${guild.name} (${guild.id})`);

  try {
    await guild.members.fetchMe();
    await setupLogChannels(guild);
    console.log(`Canais de log criados em: ${guild.name}`);
  } catch (error) {
    console.error(`Erro ao criar canais de log em ${guild.name}:`, error);
  }
}

export function registerGuildSetup(client: Client) {
  client.on(Events.GuildCreate, handleGuildCreate);
}
