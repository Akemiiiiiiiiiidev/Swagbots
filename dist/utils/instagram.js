"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTAGRAM_COMMENT_MODAL_PREFIX = exports.INSTAGRAM_VIEW_PREFIX = exports.INSTAGRAM_COMMENT_PREFIX = exports.INSTAGRAM_LIKE_PREFIX = void 0;
exports.initInstagram = initInstagram;
exports.setInstagramChannel = setInstagramChannel;
exports.getInstagramChannel = getInstagramChannel;
exports.createPost = createPost;
exports.isImageAttachment = isImageAttachment;
exports.getImageAttachmentFromMessage = getImageAttachmentFromMessage;
exports.getImageFromMessage = getImageFromMessage;
exports.setPostMessageId = setPostMessageId;
exports.setPostImageUrl = setPostImageUrl;
exports.downloadAttachment = downloadAttachment;
exports.getInstagramImageName = getInstagramImageName;
exports.savePostImageFile = savePostImageFile;
exports.loadPostImageFile = loadPostImageFile;
exports.getPost = getPost;
exports.getLikeCount = getLikeCount;
exports.userHasLiked = userHasLiked;
exports.toggleLike = toggleLike;
exports.addComment = addComment;
exports.getCommentCount = getCommentCount;
exports.getLikes = getLikes;
exports.getComments = getComments;
exports.getUserStats = getUserStats;
exports.parseInstagramId = parseInstagramId;
exports.buildInstagramPostContainer = buildInstagramPostContainer;
exports.publishInstagramPost = publishInstagramPost;
exports.updateInstagramPostMessage = updateInstagramPostMessage;
exports.formatLikesList = formatLikesList;
exports.formatCommentsList = formatCommentsList;
exports.formatPostDetails = formatPostDetails;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../database");
const BLACK = 0x000000;
const INSTAGRAM_IMAGE_DIR = (0, path_1.join)(process.cwd(), "data", "instagram");
exports.INSTAGRAM_LIKE_PREFIX = "instagram:like:";
exports.INSTAGRAM_COMMENT_PREFIX = "instagram:comment:";
exports.INSTAGRAM_VIEW_PREFIX = "instagram:view:";
exports.INSTAGRAM_COMMENT_MODAL_PREFIX = "instagram:comment-modal:";
function ensureTables() {
    (0, database_1.getDatabase)().exec(`
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
    const db = (0, database_1.getDatabase)();
    const columns = db
        .prepare(`PRAGMA table_info(instagram_likes)`)
        .all();
    if (!columns.some((column) => column.name === "created_at")) {
        db.exec(`ALTER TABLE instagram_likes ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0`);
    }
}
function initInstagram() {
    ensureTables();
}
function setInstagramChannel(guildId, channelId) {
    initInstagram();
    (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO instagram_config (guild_id, channel_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id
  `)
        .run(guildId, channelId);
}
function getInstagramChannel(guildId) {
    initInstagram();
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT channel_id as channelId FROM instagram_config WHERE guild_id = ?`)
        .get(guildId);
    return row?.channelId ?? null;
}
function createPost(guildId, userId, channelId, imageUrl, caption = "") {
    initInstagram();
    const result = (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO instagram_posts (guild_id, user_id, channel_id, image_url, caption, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
        .run(guildId, userId, channelId, imageUrl, caption, Date.now());
    return Number(result.lastInsertRowid);
}
function isImageAttachment(attachment) {
    return (attachment.contentType?.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp)$/i.test(attachment.name ?? ""));
}
function getImageAttachmentFromMessage(attachments) {
    for (const attachment of attachments) {
        if (isImageAttachment(attachment))
            return attachment;
    }
    return null;
}
function getImageFromMessage(message) {
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
function setPostMessageId(postId, messageId) {
    (0, database_1.getDatabase)()
        .prepare(`UPDATE instagram_posts SET message_id = ? WHERE id = ?`)
        .run(messageId, postId);
}
function setPostImageUrl(postId, imageUrl) {
    (0, database_1.getDatabase)()
        .prepare(`UPDATE instagram_posts SET image_url = ? WHERE id = ?`)
        .run(imageUrl, postId);
}
async function downloadAttachment(attachment) {
    const response = await fetch(attachment.url);
    if (!response.ok) {
        throw new Error(`Falha ao baixar imagem: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
}
function getInstagramImageName(attachment, postId) {
    const extension = attachment.name?.match(/\.(png|jpe?g|gif|webp)$/i)?.[0] ?? ".png";
    return `instagram-${postId}${extension.toLowerCase()}`;
}
function ensureInstagramImageDir() {
    (0, fs_1.mkdirSync)(INSTAGRAM_IMAGE_DIR, { recursive: true });
}
function savePostImageFile(postId, buffer, fileName) {
    ensureInstagramImageDir();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = (0, path_1.join)(INSTAGRAM_IMAGE_DIR, `${postId}-${safeName}`);
    (0, fs_1.writeFileSync)(filePath, buffer);
    return { path: filePath, name: safeName };
}
function loadPostImageFile(postId) {
    ensureInstagramImageDir();
    if (!(0, fs_1.existsSync)(INSTAGRAM_IMAGE_DIR))
        return null;
    const prefix = `${postId}-`;
    const storedFile = (0, fs_1.readdirSync)(INSTAGRAM_IMAGE_DIR).find((entry) => entry.startsWith(prefix));
    if (!storedFile)
        return null;
    return {
        buffer: (0, fs_1.readFileSync)((0, path_1.join)(INSTAGRAM_IMAGE_DIR, storedFile)),
        name: storedFile.slice(prefix.length),
    };
}
async function extractImageUrlFromMessage(message) {
    const directAttachment = message.attachments.first()?.url;
    if (directAttachment)
        return directAttachment;
    const refetched = await message.fetch().catch(() => null);
    return refetched?.attachments.first()?.url ?? null;
}
async function resolvePostImageUrl(post, message) {
    if (post.imageUrl.trim())
        return post.imageUrl;
    const fromMessage = await extractImageUrlFromMessage(message);
    if (fromMessage) {
        setPostImageUrl(post.id, fromMessage);
        post.imageUrl = fromMessage;
        return fromMessage;
    }
    return null;
}
async function persistImageUrlFromMessage(post, message) {
    const imageUrl = await extractImageUrlFromMessage(message);
    if (!imageUrl)
        return null;
    setPostImageUrl(post.id, imageUrl);
    post.imageUrl = imageUrl;
    return imageUrl;
}
function getPost(postId) {
    initInstagram();
    const row = (0, database_1.getDatabase)()
        .prepare(`
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
  `)
        .get(postId);
    return row ?? null;
}
function getLikeCount(postId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT COUNT(*) as count FROM instagram_likes WHERE post_id = ?`)
        .get(postId);
    return row.count;
}
function userHasLiked(postId, userId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT 1 as liked FROM instagram_likes WHERE post_id = ? AND user_id = ?`)
        .get(postId, userId);
    return Boolean(row);
}
function toggleLike(postId, userId) {
    initInstagram();
    if (userHasLiked(postId, userId)) {
        (0, database_1.getDatabase)()
            .prepare(`DELETE FROM instagram_likes WHERE post_id = ? AND user_id = ?`)
            .run(postId, userId);
        return { liked: false, count: getLikeCount(postId) };
    }
    (0, database_1.getDatabase)()
        .prepare(`INSERT INTO instagram_likes (post_id, user_id, created_at) VALUES (?, ?, ?)`)
        .run(postId, userId, Date.now());
    return { liked: true, count: getLikeCount(postId) };
}
function addComment(postId, userId, content) {
    initInstagram();
    (0, database_1.getDatabase)()
        .prepare(`
    INSERT INTO instagram_comments (post_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `)
        .run(postId, userId, content, Date.now());
}
function getCommentCount(postId) {
    const row = (0, database_1.getDatabase)()
        .prepare(`SELECT COUNT(*) as count FROM instagram_comments WHERE post_id = ?`)
        .get(postId);
    return row.count;
}
function getLikes(postId, limit = 50) {
    initInstagram();
    return (0, database_1.getDatabase)()
        .prepare(`
    SELECT user_id as userId, created_at as createdAt
    FROM instagram_likes
    WHERE post_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `)
        .all(postId, limit);
}
function getComments(postId, limit = 15) {
    initInstagram();
    return (0, database_1.getDatabase)()
        .prepare(`
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
  `)
        .all(postId, limit);
}
function getUserStats(guildId, userId) {
    initInstagram();
    const posts = (0, database_1.getDatabase)()
        .prepare(`SELECT COUNT(*) as count FROM instagram_posts WHERE guild_id = ? AND user_id = ?`)
        .get(guildId, userId);
    const likesReceived = (0, database_1.getDatabase)()
        .prepare(`
    SELECT COUNT(*) as count
    FROM instagram_likes l
    JOIN instagram_posts p ON p.id = l.post_id
    WHERE p.guild_id = ? AND p.user_id = ?
  `)
        .get(guildId, userId);
    const likesGiven = (0, database_1.getDatabase)()
        .prepare(`
    SELECT COUNT(*) as count
    FROM instagram_likes l
    JOIN instagram_posts p ON p.id = l.post_id
    WHERE p.guild_id = ? AND l.user_id = ?
  `)
        .get(guildId, userId);
    const comments = (0, database_1.getDatabase)()
        .prepare(`
    SELECT COUNT(*) as count
    FROM instagram_comments c
    JOIN instagram_posts p ON p.id = c.post_id
    WHERE p.guild_id = ? AND c.user_id = ?
  `)
        .get(guildId, userId);
    return {
        posts: posts.count,
        likesReceived: likesReceived.count,
        likesGiven: likesGiven.count,
        comments: comments.count,
    };
}
function parseInstagramId(customId, prefix) {
    if (!customId.startsWith(prefix))
        return null;
    const id = Number(customId.slice(prefix.length));
    return Number.isInteger(id) ? id : null;
}
function buildInstagramPostContainer(post, likeCount, imageUrl = post.imageUrl) {
    if (!imageUrl.trim()) {
        throw new Error(`Post ${post.id} sem URL de imagem.`);
    }
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(BLACK)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent([
        `**<@${post.userId}>**`,
        `**Publicado:** <t:${Math.floor(post.createdAt / 1000)}:R>`,
    ].join("\n")))
        .addMediaGalleryComponents(new discord_js_1.MediaGalleryBuilder().addItems(new discord_js_1.MediaGalleryItemBuilder().setURL(imageUrl)));
    if (post.caption.trim()) {
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Legenda:** ${post.caption.trim()}`));
    }
    return container.addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`${exports.INSTAGRAM_LIKE_PREFIX}${post.id}`)
        .setLabel(`Curtir (${likeCount})`)
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`${exports.INSTAGRAM_COMMENT_PREFIX}${post.id}`)
        .setLabel("Comentar")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId(`${exports.INSTAGRAM_VIEW_PREFIX}${post.id}`)
        .setLabel("Ver")
        .setStyle(discord_js_1.ButtonStyle.Secondary)));
}
async function publishInstagramPost(channel, post, imageUpload) {
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
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        setPostMessageId(post.id, uploadMessage.id);
        return uploadMessage;
    }
    if (!post.imageUrl.trim()) {
        throw new Error(`Post ${post.id} sem URL de imagem.`);
    }
    const message = await channel.send({
        components: [buildInstagramPostContainer(post, 0, post.imageUrl)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    });
    setPostMessageId(post.id, message.id);
    return message;
}
async function updateInstagramPostMessage(channel, post, likeCount) {
    if (!post.messageId)
        return;
    const message = await channel.messages.fetch(post.messageId).catch(() => null);
    if (!message)
        return;
    let imageUrl = await resolvePostImageUrl(post, message);
    if (!imageUrl) {
        const imageFile = loadPostImageFile(post.id);
        if (!imageFile)
            return;
        const edited = await message.edit({
            files: [{ attachment: imageFile.buffer, name: imageFile.name }],
            components: [
                buildInstagramPostContainer(post, likeCount, `attachment://${imageFile.name}`),
            ],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        await persistImageUrlFromMessage(post, edited);
        return;
    }
    await message.edit({
        components: [buildInstagramPostContainer(post, likeCount, imageUrl)],
        flags: discord_js_1.MessageFlags.IsComponentsV2,
    });
}
function formatRelativeTime(createdAt) {
    if (!createdAt)
        return "horario desconhecido";
    return `<t:${Math.floor(createdAt / 1000)}:R>`;
}
function formatLikesList(likes, total) {
    if (total === 0) {
        return "Ninguem curtiu ainda.";
    }
    const lines = likes.map((like) => `<@${like.userId}> - ${formatRelativeTime(like.createdAt)}`);
    if (total > likes.length) {
        lines.push(`Mostrando ${likes.length} de ${total} curtidas.`);
    }
    return lines.join("\n");
}
function formatCommentsList(comments, total) {
    if (total === 0) {
        return "Nenhum comentário ainda.";
    }
    const lines = comments.map((comment) => `**<@${comment.userId}>:** ${comment.content}\n${formatRelativeTime(comment.createdAt)}`);
    if (total > comments.length) {
        lines.push(`Mostrando os ${comments.length} comentários mais recentes.`);
    }
    return lines.join("\n\n");
}
function formatPostDetails(post, likes, likeTotal, comments, commentTotal) {
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
//# sourceMappingURL=instagram.js.map