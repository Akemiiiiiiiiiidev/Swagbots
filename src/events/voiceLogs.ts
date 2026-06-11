import { VoiceState } from "discord.js";
import { logVoiceStateChange } from "../utils/logs";

export async function handleVoiceLogs(
  oldState: VoiceState,
  newState: VoiceState
) {
  await logVoiceStateChange(oldState, newState);
}
