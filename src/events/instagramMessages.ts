import {
  Client,
  Events,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import {
  createPost,
  downloadAttachment,
  getImageFromMessage,
  getInstagramChannel,
  getInstagramImageName,
  getPost,
  initInstagram,
  publishInstagramPost,
} from "../utils/instagram";

export function registerInstagramMessages(client: Client) {
  initInstagram();

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;
    if (!message.channel.isTextBased() || message.channel.isDMBased()) return;

    const instagramChannelId = getInstagramChannel(message.guild.id);
    if (!instagramChannelId || message.channel.id !== instagramChannelId) return;

    const channel = message.channel as TextChannel;
    const botMember = message.guild.members.me;
    if (!botMember) return;

    const permissions = channel.permissionsFor(botMember);
    if (
      !permissions?.has(PermissionFlagsBits.SendMessages) ||
      !permissions.has(PermissionFlagsBits.AttachFiles) ||
      !permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      console.warn(
        `Instagram: permissoes insuficientes em #${channel.name} (${channel.id})`
      );
      return;
    }

    let resolvedMessage = message;
    if (message.attachments.size === 0 && message.embeds.length === 0) {
      resolvedMessage =
        (await message.fetch().catch(() => null)) ?? message;
    }

    const image = getImageFromMessage(resolvedMessage);
    if (!image) return;

    const caption = message.content.trim();

    try {
      const imageBuffer = image.attachment
        ? await downloadAttachment(image.attachment)
        : await downloadAttachmentFromUrl(image.url);

      const postId = createPost(
        message.guild.id,
        message.author.id,
        instagramChannelId,
        "",
        caption
      );

      const post = getPost(postId);
      if (!post) return;

      await publishInstagramPost(channel, post, {
        buffer: imageBuffer,
        name: image.attachment
          ? getInstagramImageName(image.attachment, postId)
          : `instagram-${postId}.png`,
      });

      await message.delete().catch(() => null);
    } catch (error) {
      console.error("Erro ao criar post do instagram:", error);
    }
  });
}

async function downloadAttachmentFromUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
