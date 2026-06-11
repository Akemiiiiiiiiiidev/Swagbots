"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delcargo = void 0;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const moderation_1 = require("../utils/moderation");
const SNOWFLAKE_REGEX = /^\d{17,20}$/;
exports.delcargo = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("delcargo")
        .setDescription("Deleta um cargo do servidor")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
        .addRoleOption((option) => option
        .setName("cargo")
        .setDescription("Cargo para deletar")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("id")
        .setDescription("ID do cargo para deletar")
        .setRequired(false)),
    async execute(interaction) {
        const permissionError = (0, moderation_1.checkModeratorPermissions)(interaction, discord_js_1.PermissionFlagsBits.ManageRoles);
        if (permissionError) {
            await interaction.reply((0, container_1.containerReply)(permissionError, { ephemeral: true }));
            return;
        }
        const guild = interaction.guild;
        const executor = interaction.member;
        if (!guild || !executor || typeof executor.permissions === "string") {
            await interaction.reply((0, container_1.containerReply)("Este comando só pode ser usado em um servidor.", {
                ephemeral: true,
            }));
            return;
        }
        const roleOption = interaction.options.getRole("cargo");
        const idOption = interaction.options.getString("id");
        if (!roleOption && !idOption) {
            await interaction.reply((0, container_1.containerReply)("Informe o cargo ou o ID.", { ephemeral: true }));
            return;
        }
        const roleId = roleOption?.id ?? idOption?.trim();
        if (!roleId || !SNOWFLAKE_REGEX.test(roleId)) {
            await interaction.reply((0, container_1.containerReply)("ID de cargo inválido.", { ephemeral: true }));
            return;
        }
        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
            await interaction.reply((0, container_1.containerReply)("Cargo não encontrado neste servidor.", {
                ephemeral: true,
            }));
            return;
        }
        if (role.id === guild.id) {
            await interaction.reply((0, container_1.containerReply)("Não posso deletar o cargo @everyone.", {
                ephemeral: true,
            }));
            return;
        }
        if (role.managed) {
            await interaction.reply((0, container_1.containerReply)("Não posso deletar cargos gerenciados por integrações.", {
                ephemeral: true,
            }));
            return;
        }
        const botMember = guild.members.me;
        const executorId = "id" in executor ? executor.id : executor.user.id;
        const executorMember = executor;
        if (role.position >= botMember.roles.highest.position) {
            await interaction.reply((0, container_1.containerReply)("Não posso deletar um cargo igual ou superior ao meu.", { ephemeral: true }));
            return;
        }
        if (role.position >= executorMember.roles.highest.position &&
            executorId !== guild.ownerId) {
            await interaction.reply((0, container_1.containerReply)("Este cargo é igual ou superior ao seu.", {
                ephemeral: true,
            }));
            return;
        }
        const roleName = role.name;
        await role.delete(`${interaction.user.tag}: cargo removido`);
        await interaction.reply((0, container_1.containerReply)([
            "**Cargo deletado**",
            `**Cargo:** ${roleName}`,
            `**ID:** ${roleId}`,
            `**Moderador:** ${interaction.user.tag}`,
        ].join("\n")));
    },
};
//# sourceMappingURL=delcargo.js.map