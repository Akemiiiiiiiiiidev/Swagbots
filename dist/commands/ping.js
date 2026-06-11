"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
exports.ping = {
    data: new discord_js_1.SlashCommandBuilder().setName("ping").setDescription("Verifica a latência do bot"),
    async execute(interaction) {
        const sent = await interaction.reply({ ...(0, container_1.containerReply)(`${container_1.E} Calculando ping...`), fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        await interaction.editReply((0, container_1.containerEdit)(`${container_1.V} Pong\n${container_1.E} Latência: **${latency}ms**\n${container_1.E} API: **${apiLatency}ms**`));
    },
};
//# sourceMappingURL=ping.js.map