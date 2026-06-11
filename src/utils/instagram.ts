import {
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  Message,
  MessageFlags,
  TextChannel,
  TextDisplayBuilder,
} from "discord.js";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getDatabase } from "../database";

const BLACK = 0x000000;
const INSTAGRAM_IMAGE_DIR = join(process.cwd(), "data", "instagram");

export const INSTAGRAM_LIKE_PREFIX = "instagram:like:";
export const INSTAGRAM_COMMENT_PREFIX = "instagram:comment:";
export const INSTAGRAM_VIEW_PREFIX = "instagram:view:";
export const INSTAGRAM_COMMENT_MODAL_PREFIX = "instagram:comment-modal:";

export type InstagramPost = {
  id: number;
  guildId: string;
  userId: string;
  channelId: string;
  messageId: string | null;
  imageUrl: string;
  caption: string;
  createdAt: number;
};

export type InstagramComment = {
  id: number;
  postId: number;
  userId: string;
  content: string;
  createdAt: number;
};

export type InstagramLike = {
  userId: string;
  createdAt: number;
};

function ensureTables() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS instagram_config (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS instagram_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT,
      image_url TEXT NOT NULL,
      caption TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS instagram_likes (
      post_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS instagram_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_instagram_posts_guild
    ON instagram_posts (guild_id, user_id);

    CREATE INDEX IF NOT EXISTS idx_instagram_comments_post
    ON instagram_comments (post_id, created_at);
  `);

  migrateInstagramLikesTimestamp();
}

function migrateInstagramLikesTimestamp() {
  const db = getDatabase();
  const columns = db
    .prepare(`PRAGMA table_info(instagram_likes)`)
    .all() as { name: string }[];

  if (!columns.some((column) => column.name === "created_at")) {
    db.exec(
      `ALTER TABLE instagram_likes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0`
    );
  }
}

export function initInstagram() {
  ensureTables();
}

export function setInstagramChannel(guildId: string, channelId: string) {
  initInstagram();
  getDatabase()
    .prepare(
      `
    INSERT INTO instagram_config (guild_id, channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id
  `
    )
    .run(guildId, channelId);
}

export function getInstagramChannel(guildId: string): string | null {
  initInstagram();
  const row = getDatabase()
    .prepare(`SELECT channel_id as channelId FROM instagram_config WHERE guild_id = ?`)
    .get(guildId) as { channelId: string } | undefined;

  return row?.channelId ?? null;
}

export function createPost(
  guildId: string,
  userId: string,
  channelId: string,
  imageUrl: string,
  caption = ""
) {
  initInstagram();
  const result = getDatabase()
    .prepare(
      `
    INSERT INTO instagram_posts (guild_id, user_id, channel_id, image_url, caption, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(guildId, userId, channelId, imageUrl, caption, Date.now());

  return Number(result.lastInsertRowid);
}

export function isImageAttachment(attachment: Attachment) {
  return (
    attachment.contentType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp)$/i.test(attachment.name ?? "")
  );
}

export function getImageAttachmentFromMessage(
  attachments: Iterable<Attachment>
): Attachment | null {
  for (const attachment of attachments) {
    if (isImageAttachment(attachment)) return attachment;
  }

  return null;
}

export function getImageFromMessage(message: Message) {
  const attachment = getImageAttachmentFromMessage(message.attachments.values());
  if (attachment) {
    return {
      url: attachment.url,
      name: attachment.name ?? "image.png",
      attachment,
    };
  }

  for (const embed of message.embeds) {
    const url = embed.image?.url ?? embed.thumbnail?.url;
    if (url) {
      return {
        url,
        name: "image.png",
      };
    }
  }

  return null;
}

export function setPostMessageId(postId: number, messageId: string) {
  getDatabase()
    .prepare(`UPDATE instagram_posts SET message_id = ? WHERE id = ?`)
    .run(messageId, postId);
}

export function setPostImageUrl(postId: number, imageUrl: string) {
  getDatabase()
    .prepare(`UPDATE instagram_posts SET image_url = ? WHERE id = ?`)
    .run(imageUrl, postId);
}

export async function downloadAttachment(attachment: Attachment) {
  const response = await fetch(attachment.url);

  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function getInstagramImageName(attachment: Attachment, postId: number) {
  const extension =
    attachment.name?.match(/\.(png|jpe?g|gif|webp)$/i)?.[0] ?? ".png";

  return `instagram-${postId}${extension.toLowerCase()}`;
}

export type InstagramImageUpload = {
  buffer: Buffer;
  name: string;
};

function ensureInstagramImageDir() {
  mkdirSync(INSTAGRAM_IMAGE_DIR, { recursive: true });
}

export function savePostImageFile(
  postId: number,
  buffer: Buffer,
  fileName: string
) {
  ensureInstagramImageDir();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = join(INSTAGRAM_IMAGE_DIR, `${postId}-${safeName}`);
  writeFileSync(filePath, buffer);
  return { path: filePath, name: safeName };
}

export function loadPostImageFile(
  postId: number
): { buffer: Buffer; name: string } | null {
  ensureInstagramImageDir();

  if (!existsSync(INSTAGRAM_IMAGE_DIR)) return null;

  const prefix = `${postId}-`;
  const storedFile = readdirSync(INSTAGRAM_IMAGE_DIR).find((entry) =>
    entry.startsWith(prefix)
  );

  if (!storedFile) return null;

  return {
    buffer: readFileSync(join(INSTAGRAM_IMAGE_DIR, storedFile)),
    name: storedFile.slice(prefix.length),
  };
}

async function extractImageUrlFromMessage(message: Message) {
  const directAttachment = message.attachments.first()?.url;
  if (directAttachment) return directAttachment;

  const refetched = await message.fetch().catch(() => null);
  return refetched?.attachments.first()?.url ?? null;
}

async function resolvePostImageUrl(post: InstagramPost, message: Message) {
  if (post.imageUrl.trim()) return post.imageUrl;

  const fromMessage = await extractImageUrlFromMessage(message);
  if (fromMessage) {
    setPostImageUrl(post.id, fromMessage);
    post.imageUrl = fromMessage;
    return fromMessage;
  }

  return null;
}

async function persistImageUrlFromMessage(post: InstagramPost, message: Message) {
  const imageUrl = await extractImageUrlFromMessage(message);
  if (!imageUrl) return null;

  setPostImageUrl(post.id, imageUrl);
  post.imageUrl = imageUrl;
  return imageUrl;
}

export function getPost(postId: number): InstagramPost | null {
  initInstagram();
  const row = getDatabase()
    .prepare(
      `
    SELECT
      id,
      guild_id as guildId,
      user_id as userId,
      channel_id as channelId,
      message_id as messageId,
      image_url as imageUrl,
      caption,
      created_at as createdAt
    FROM instagram_posts
    WHERE id = ?
  `
    )
    .get(postId) as InstagramPost | undefined;

  return row ?? null;
}

export function getLikeCount(postId: number): number {
  const row = getDatabase()
    .prepare(`SELECT COUNT(*) as count FROM instagram_likes WHERE post_id = ?`)
    .get(postId) as { count: number };

  return row.count;
}

export function userHasLiked(postId: number, userId: string): boolean {
  const row = getDatabase()
    .prepare(
      `SELECT 1 as liked FROM instagram_likes WHERE post_id = ? AND user_id = ?`
    )
    .get(postId, userId) as { liked: number } | undefined;

  return Boolean(row);
}

export function toggleLike(
  postId: number,
  userId: string
): { liked: boolean; count: number } {
  initInstagram();

  if (userHasLiked(postId, userId)) {
    getDatabase()
      .prepare(`DELETE FROM instagram_likes WHERE post_id = ? AND user_id = ?`)
      .run(postId, userId);

    return { liked: false, count: getLikeCount(postId) };
  }

  getDatabase()
    .prepare(
      `INSERT INTO instagram_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`
    )
    .run(postId, userId, Date.now());

  return { liked: true, count: getLikeCount(postId) };
}

export function addComment(postId: number, userId: string, content: string) {
  initInstagram();
  getDatabase()
    .prepare(
      `
    INSERT INTO instagram_comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `
    )
    .run(postId, userId, content, Date.now());
}

export function getCommentCount(postId: number): number {
  const row = getDatabase()
    .prepare(`SELECT COUNT(*) as count FROM instagram_comments WHERE post_id = ?`)
    .get(postId) as { count: number };

  return row.count;
}

export function getLikes(postId: number, limit = 50): InstagramLike[] {
  initInstagram();
  return getDatabase()
    .prepare(
      `
    SELECT user_id as userId, created_at as createdAt
    FROM instagram_likes
    WHERE post_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `
    )
    .all(postId, limit) as InstagramLike[];
}

export function getComments(postId: number, limit = 15): InstagramComment[] {
  initInstagram();
  return getDatabase()
    .prepare(
      `
    SELECT
      id,
      post_id as postId,
      user_id as userId,
      content,
      created_at as createdAt
    FROM instagram_comments
    WHERE post_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `
    )
    .all(postId, limit) as InstagramComment[];
}

export function getUserStats(guildId: string, userId: string) {
  initInstagram();

  const posts = getDatabase()
    .prepare(
      `SELECT COUNT(*) as count FROM instagram_posts WHERE guild_id = ? AND user_id = ?`
    )
    .get(guildId, userId) as { count: number };

  const likesReceived = getDatabase()
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM instagram_likes l
    JOIN instagram_posts p ON p.id = l.post_id
    WHERE p.guild_id = ? AND p.user_id = ?
  `
    )
    .get(guildId, userId) as { count: number };

  const likesGiven = getDatabase()
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM instagram_likes l
    JOIN instagram_posts p ON p.id = l.post_id
    WHERE p.guild_id = ? AND l.user_id = ?
  `
    )
    .get(guildId, userId) as { count: number };

  const comments = getDatabase()
    .prepare(
      `
    SELECT COUNT(*) as count
    FROM instagram_comments c
    JOIN instagram_posts p ON p.id = c.post_id
    WHERE p.guild_id = ? AND c.user_id = ?
  `
    )
    .get(guildId, userId) as { count: number };

  return {
    posts: posts.count,
    likesReceived: likesReceived.count,
    likesGiven: likesGiven.count,
    comments: comments.count,
  };
}

export function parseInstagramId(
  customId: string,
  prefix: string
): number | null {
  if (!customId.startsWith(prefix)) return null;
  const id = Number(customId.slice(prefix.length));
  return Number.isInteger(id) ? id : null;
}

export function buildInstagramPostContainer(
  post: InstagramPost,
  likeCount: number,
  imageUrl = post.imageUrl
) {
  if (!imageUrl.trim()) {
    throw new Error(`Post ${post.id} sem URL de imagem.`);
  }

  const container = new ContainerBuilder()
    .setAccentColor(BLACK)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**<@${post.userId}>**`,
          `**Publicado:** <t:${Math.floor(post.createdAt / 1000)}:R>`,
        ].join("\n")
      )
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(imageUrl)
      )
    );

  if (post.caption.trim()) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Legenda:** ${post.caption.trim()}`)
    );
  }

  return container.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${INSTAGRAM_LIKE_PREFIX}${post.id}`)
          .setLabel(`Curtir (${likeCount})`)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`${INSTAGRAM_COMMENT_PREFIX}${post.id}`)
          .setLabel("Comentar")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`${INSTAGRAM_VIEW_PREFIX}${post.id}`)
          .setLabel("Ver")
          .setStyle(ButtonStyle.Secondary)
      )
    );
}

export async function publishInstagramPost(
  channel: TextChannel,
  post: InstagramPost,
  imageUpload?: InstagramImageUpload
) {
  if (imageUpload) {
    savePostImageFile(post.id, imageUpload.buffer, imageUpload.name);

    const uploadMessage = await channel.send({
      files: [{ attachment: imageUpload.buffer, name: imageUpload.name }],
    });

    const imageUrl = uploadMessage.attachments.first()?.url;
    if (!imageUrl) {
      await uploadMessage.delete().catch(() => null);
      throw new Error("Falha ao hospedar imagem do post.");
    }

    setPostImageUrl(post.id, imageUrl);
    post.imageUrl = imageUrl;

    await uploadMessage.edit({
      components: [buildInstagramPostContainer(post, 0, imageUrl)],
      flags: MessageFlags.IsComponentsV2,
    });

    setPostMessageId(post.id, uploadMessage.id);
    return uploadMessage;
  }

  if (!post.imageUrl.trim()) {
    throw new Error(`Post ${post.id} sem URL de imagem.`);
  }

  const message = await channel.send({
    components: [buildInstagramPostContainer(post, 0, post.imageUrl)],
    flags: MessageFlags.IsComponentsV2,
  });

  setPostMessageId(post.id, message.id);
  return message;
}

export async function updateInstagramPostMessage(
  channel: TextChannel,
  post: InstagramPost,
  likeCount: number
) {
  if (!post.messageId) return;

  const message = await channel.messages.fetch(post.messageId).catch(() => null);
  if (!message) return;

  let imageUrl = await resolvePostImageUrl(post, message);

  if (!imageUrl) {
    const imageFile = loadPostImageFile(post.id);
    if (!imageFile) return;

    const edited = await message.edit({
      files: [{ attachment: imageFile.buffer, name: imageFile.name }],
      components: [
        buildInstagramPostContainer(
          post,
          likeCount,
          `attachment://${imageFile.name}`
        ),
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    await persistImageUrlFromMessage(post, edited);
    return;
  }

  await message.edit({
    components: [buildInstagramPostContainer(post, likeCount, imageUrl)],
    flags: MessageFlags.IsComponentsV2,
  });
}

function formatRelativeTime(createdAt: number) {
  if (!createdAt) return "horario desconhecido";
  return `<t:${Math.floor(createdAt / 1000)}:R>`;
}

export function formatLikesList(likes: InstagramLike[], total: number) {
  if (total === 0) {
    return "Ninguem curtiu ainda.";
  }

  const lines = likes.map(
    (like) => `<@${like.userId}> - ${formatRelativeTime(like.createdAt)}`
  );

  if (total > likes.length) {
    lines.push(`Mostrando ${likes.length} de ${total} curtidas.`);
  }

  return lines.join("\n");
}

export function formatCommentsList(comments: InstagramComment[], total: number) {
  if (total === 0) {
    return "Nenhum comentário ainda.";
  }

  const lines = comments.map(
    (comment) =>
      `**<@${comment.userId}>:** ${comment.content}\n${formatRelativeTime(comment.createdAt)}`
  );

  if (total > comments.length) {
    lines.push(`Mostrando os ${comments.length} comentários mais recentes.`);
  }

  return lines.join("\n\n");
}

export function formatPostDetails(
  post: InstagramPost,
  likes: InstagramLike[],
  likeTotal: number,
  comments: InstagramComment[],
  commentTotal: number
) {
  return [
    `**<@${post.userId}>**`,
    [
      `**Curtidas (${likeTotal})**`,
      formatLikesList(likes, likeTotal),
      `**Comentários (${commentTotal})**`,
      formatCommentsList(comments, commentTotal),
    ].join("\n\n"),
  ];
}
