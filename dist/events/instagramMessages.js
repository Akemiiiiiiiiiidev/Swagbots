"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstagramMessages = registerInstagramMessages;
const discord_js_1 = require("discord.js");
const instagram_1 = require("../utils/instagram");
function registerInstagramMessages(client) {
    (0, instagram_1.initInstagram)();
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.author.bot || !message.guild)
            return;
        if (!message.channel.isTextBased() || message.channel.isDMBased())
            return;
        const instagramChannelId = (0, instagram_1.getInstagramChannel)(message.guild.id);
        if (!instagramChannelId || message.channel.id !== instagramChannelId)
            return;
        const channel = message.channel;
        const botMember = message.guild.members.me;
        if (!botMember)
            return;
        const permissions = channel.permissionsFor(botMember);
        if (!permissions?.has(discord_js_1.PermissionFlagsBits.SendMessages) ||
            !permissions.has(discord_js_1.PermissionFlagsBits.AttachFiles) ||
            !permissions.has(discord_js_1.PermissionFlagsBits.ManageMessages)) {
            console.warn(`Instagram: permissoes insuficientes em #${channel.name} (${channel.id})`);
            return;
        }
        let resolvedMessage = message;
        if (message.attachments.size === 0 && message.embeds.length === 0) {
            resolvedMessage =
                (await message.fetch().catch(() => null)) ?? message;
        }
        const image = (0, instagram_1.getImageFromMessage)(resolvedMessage);
        if (!image)
            return;
        const caption = message.content.trim();
        try {
            const imageBuffer = image.attachment
                ? await (0, instagram_1.downloadAttachment)(image.attachment)
                : await downloadAttachmentFromUrl(image.url);
            const postId = (0, instagram_1.createPost)(message.guild.id, message.author.id, instagramChannelId, "", caption);
            const post = (0, instagram_1.getPost)(postId);
            if (!post)
                return;
            await (0, instagram_1.publishInstagramPost)(channel, post, {
                buffer: imageBuffer,
                name: image.attachment
                    ? (0, instagram_1.getInstagramImageName)(image.attachment, postId)
                    : `instagram-${postId}.png`,
            });
            await message.delete().catch(() => null);
        }
        catch (error) {
            console.error("Erro ao criar post do instagram:", error);
        }
    });
}
async function downloadAttachmentFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha ao baixar imagem: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
}
//# sourceMappingURL=instagramMessages.js.map