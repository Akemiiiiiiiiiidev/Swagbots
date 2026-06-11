"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
exports.user = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("user")
        .setDescription("Mostra informações sobre você ou outro membro")
        .addUserOption((option) => option.setName("membro").setDescription("Membro para consultar").setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser("membro") ?? interaction.user;
        const member = interaction.guild?.members.cache.get(target.id);
        await interaction.reply((0, container_1.containerReply)([
            `${container_1.E} **Usuário:** ${target.tag}`,
            `${container_1.E} **ID:** ${target.id}`,
            `${container_1.E} **Conta criada:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
            member
                ? `${container_1.E} **Entrou no servidor:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                : null,
        ]
            .filter(Boolean)
            .join("\n")));
    },
};
//# sourceMappingURL=user.js.map