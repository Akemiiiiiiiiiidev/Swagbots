"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initInstagramSystem = initInstagramSystem;
exports.handleInstagramButton = handleInstagramButton;
exports.handleInstagramModal = handleInstagramModal;
const discord_js_1 = require("discord.js");
const container_1 = require("../utils/container");
const instagram_1 = require("../utils/instagram");
function initInstagramSystem() {
    (0, instagram_1.initInstagram)();
}
async function refreshPostCounts(interaction, postId) {
    const guild = interaction.guild;
    if (!guild)
        return;
    const post = (0, instagram_1.getPost)(postId);
    if (!post)
        return;
    const channel = guild.channels.cache.get(post.channelId);
    if (channel?.isTextBased() && !channel.isDMBased()) {
        await (0, instagram_1.updateInstagramPostMessage)(channel, post, (0, instagram_1.getLikeCount)(postId));
    }
}
async function handleInstagramButton(interaction) {
    const likeId = (0, instagram_1.parseInstagramId)(interaction.customId, instagram_1.INSTAGRAM_LIKE_PREFIX);
    if (likeId) {
        const guild = interaction.guild;
        if (!guild)
            return true;
        const post = (0, instagram_1.getPost)(likeId);
        if (!post || post.guildId !== guild.id) {
            await interaction.reply((0, container_1.containerReplyOrganized)(["Publicação nao encontrada."], { ephemeral: true }));
            return true;
        }
        const { liked } = (0, instagram_1.toggleLike)(likeId, interaction.user.id);
        await refreshPostCounts(interaction, likeId);
        await interaction.reply((0, container_1.containerReplyOrganized)([
            liked
                ? "Voce curtiu a publicação."
                : "Voce removeu sua curtida.",
        ], { ephemeral: true }));
        return true;
    }
    const commentId = (0, instagram_1.parseInstagramId)(interaction.customId, instagram_1.INSTAGRAM_COMMENT_PREFIX);
    if (commentId) {
        const guild = interaction.guild;
        if (!guild)
            return true;
        const post = (0, instagram_1.getPost)(commentId);
        if (!post || post.guildId !== guild.id) {
            await interaction.reply((0, container_1.containerReplyOrganized)(["Publicação nao encontrada."], { ephemeral: true }));
            return true;
        }
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId(`${instagram_1.INSTAGRAM_COMMENT_MODAL_PREFIX}${commentId}`)
            .setTitle("Novo comentário")
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId("conteudo")
            .setLabel("Comentário")
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true)));
        await interaction.showModal(modal);
        return true;
    }
    const viewId = (0, instagram_1.parseInstagramId)(interaction.customId, instagram_1.INSTAGRAM_VIEW_PREFIX);
    if (viewId) {
        const guild = interaction.guild;
        if (!guild)
            return true;
        const post = (0, instagram_1.getPost)(viewId);
        if (!post || post.guildId !== guild.id) {
            await interaction.reply((0, container_1.containerReplyOrganized)(["Publicação nao encontrada."], { ephemeral: true }));
            return true;
        }
        const comments = (0, instagram_1.getComments)(viewId);
        const commentTotal = (0, instagram_1.getCommentCount)(viewId);
        const likes = (0, instagram_1.getLikes)(viewId);
        const likeTotal = (0, instagram_1.getLikeCount)(viewId);
        await interaction.reply((0, container_1.containerReplyOrganized)((0, instagram_1.formatPostDetails)(post, likes, likeTotal, comments, commentTotal), { ephemeral: true }));
        return true;
    }
    return false;
}
async function handleInstagramModal(interaction) {
    const postId = (0, instagram_1.parseInstagramId)(interaction.customId, instagram_1.INSTAGRAM_COMMENT_MODAL_PREFIX);
    if (!postId)
        return false;
    const guild = interaction.guild;
    if (!guild)
        return true;
    const post = (0, instagram_1.getPost)(postId);
    if (!post || post.guildId !== guild.id) {
        await interaction.reply((0, container_1.containerReplyOrganized)(["Publicação nao encontrada."], { ephemeral: true }));
        return true;
    }
    const content = interaction.fields.getTextInputValue("conteudo").trim();
    if (!content) {
        await interaction.reply((0, container_1.containerReplyOrganized)(["O comentário nao pode estar vazio."], { ephemeral: true }));
        return true;
    }
    (0, instagram_1.addComment)(postId, interaction.user.id, content);
    await refreshPostCounts(interaction, postId);
    await interaction.reply((0, container_1.containerReplyOrganized)(["Comentário adicionado."], { ephemeral: true }));
    return true;
}
//# sourceMappingURL=instagramInteractions.js.map