import { Client, Events, VoiceState } from "discord.js";
import { getColeira, removeColeira } from "../utils/coleira";

async function handleColeiraVoice(oldState: VoiceState, newState: VoiceState) {
  const guild = newState.guild;
  const targetId = newState.id;

  // Só age quando o alvo realmente muda de canal de voz
  if (oldState.channelId === newState.channelId) return;

  const executorId = getColeira(guild.id, targetId);
  if (!executorId) return;

  // Se o alvo saiu de todas as calls, não move o executor
  const targetChannel = newState.channel;
  if (!targetChannel) return;

  // Busca o executor no servidor
  const executor = await guild.members.fetch(executorId).catch(() => null);
  if (!executor) {
    // Executor saiu do servidor — remove a coleira
    removeColeira(guild.id, targetId);
    return;
  }

  // Executor precisa estar em alguma call para poder ser movido pela API
  if (!executor.voice.channelId) return;

  try {
    await executor.voice.setChannel(targetChannel, `Coleira: seguindo ${targetId}`);
  } catch (error) {
    console.error(`Erro ao mover executor na coleira:`, error);
  }
}

export function registerColeiraVoice(client: Client) {
  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    handleColeiraVoice(oldState, newState).catch((error) => {
      console.error("Erro no sistema de coleira:", error);
    });
  });
}
