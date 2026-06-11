"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVoiceLogs = handleVoiceLogs;
const logs_1 = require("../utils/logs");
async function handleVoiceLogs(oldState, newState) {
    await (0, logs_1.logVoiceStateChange)(oldState, newState);
}
//# sourceMappingURL=voiceLogs.js.map