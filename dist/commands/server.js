"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
exports.server = {
    data: new discord_js_1.SlashCommandBuilder().setName("server").setDescription("Mostra informações sobre o servidor"),
    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply((0, container_1.containerReply)(`${container_1.E} Este comando só pode ser usado em um servidor.`, { ephemeral: true }));
            return;
        }
        await interaction.reply((0, container_1.containerReply)([
            `${container_1.V} **Servidor:** ${guild.name}`,
            `${container_1.E} **ID:** ${guild.id}`,
            `${container_1.E} **Dono:** <@${guild.ownerId}>`,
            `${container_1.E} **Membros:** ${guild.memberCount}`,
            `${container_1.E} **Criado em:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
        ].join("\n")));
    },
};
//# sourceMappingURL=server.js.map