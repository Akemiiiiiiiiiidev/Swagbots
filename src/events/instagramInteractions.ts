import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { containerReplyOrganized } from "../utils/container";
import {
  addComment,
  formatPostDetails,
  getCommentCount,
  getComments,
  getLikeCount,
  getLikes,
  getPost,
  initInstagram,
  INSTAGRAM_COMMENT_MODAL_PREFIX,
  INSTAGRAM_COMMENT_PREFIX,
  INSTAGRAM_LIKE_PREFIX,
  INSTAGRAM_VIEW_PREFIX,
  parseInstagramId,
  toggleLike,
  updateInstagramPostMessage,
} from "../utils/instagram";

export function initInstagramSystem() {
  initInstagram();
}

async function refreshPostCounts(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  postId: number
) {
  const guild = interaction.guild;
  if (!guild) return;

  const post = getPost(postId);
  if (!post) return;

  const channel = guild.channels.cache.get(post.channelId);

  if (channel?.isTextBased() && !channel.isDMBased()) {
    await updateInstagramPostMessage(
      channel as TextChannel,
      post,
      getLikeCount(postId)
    );
  }
}

export async function handleInstagramButton(
  interaction: ButtonInteraction
): Promise<boolean> {
  const likeId = parseInstagramId(interaction.customId, INSTAGRAM_LIKE_PREFIX);

  if (likeId) {
    const guild = interaction.guild;
    if (!guild) return true;

    const post = getPost(likeId);

    if (!post || post.guildId !== guild.id) {
      await interaction.reply(
        containerReplyOrganized(
          ["Publicação nao encontrada."],
          { ephemeral: true }
        )
      );
      return true;
    }

    const { liked } = toggleLike(likeId, interaction.user.id);

    await refreshPostCounts(interaction, likeId);

    await interaction.reply(
      containerReplyOrganized(
        [
          liked
            ? "Voce curtiu a publicação."
            : "Voce removeu sua curtida.",
        ],
        { ephemeral: true }
      )
    );

    return true;
  }

  const commentId = parseInstagramId(
    interaction.customId,
    INSTAGRAM_COMMENT_PREFIX
  );

  if (commentId) {
    const guild = interaction.guild;
    if (!guild) return true;

    const post = getPost(commentId);

    if (!post || post.guildId !== guild.id) {
      await interaction.reply(
        containerReplyOrganized(
          ["Publicação nao encontrada."],
          { ephemeral: true }
        )
      );
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(`${INSTAGRAM_COMMENT_MODAL_PREFIX}${commentId}`)
      .setTitle("Novo comentário")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("conteudo")
            .setLabel("Comentário")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(500)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
    return true;
  }

  const viewId = parseInstagramId(interaction.customId, INSTAGRAM_VIEW_PREFIX);

  if (viewId) {
    const guild = interaction.guild;
    if (!guild) return true;

    const post = getPost(viewId);

    if (!post || post.guildId !== guild.id) {
      await interaction.reply(
        containerReplyOrganized(
          ["Publicação nao encontrada."],
          { ephemeral: true }
        )
      );
      return true;
    }

    const comments = getComments(viewId);
    const commentTotal = getCommentCount(viewId);
    const likes = getLikes(viewId);
    const likeTotal = getLikeCount(viewId);

    await interaction.reply(
      containerReplyOrganized(
        formatPostDetails(post, likes, likeTotal, comments, commentTotal),
        { ephemeral: true }
      )
    );

    return true;
  }

  return false;
}

export async function handleInstagramModal(
  interaction: ModalSubmitInteraction
): Promise<boolean> {
  const postId = parseInstagramId(
    interaction.customId,
    INSTAGRAM_COMMENT_MODAL_PREFIX
  );

  if (!postId) return false;

  const guild = interaction.guild;
  if (!guild) return true;

  const post = getPost(postId);

  if (!post || post.guildId !== guild.id) {
    await interaction.reply(
      containerReplyOrganized(
        ["Publicação nao encontrada."],
        { ephemeral: true }
      )
    );
    return true;
  }

  const content = interaction.fields.getTextInputValue("conteudo").trim();

  if (!content) {
    await interaction.reply(
      containerReplyOrganized(
        ["O comentário nao pode estar vazio."],
        { ephemeral: true }
      )
    );
    return true;
  }

  addComment(postId, interaction.user.id, content);
  await refreshPostCounts(interaction, postId);

  await interaction.reply(
    containerReplyOrganized(["Comentário adicionado."], { ephemeral: true })
  );

  return true;
}
