import { Attachment, ContainerBuilder, Message, TextChannel } from "discord.js";
export declare const INSTAGRAM_LIKE_PREFIX = "instagram:like:";
export declare const INSTAGRAM_COMMENT_PREFIX = "instagram:comment:";
export declare const INSTAGRAM_VIEW_PREFIX = "instagram:view:";
export declare const INSTAGRAM_COMMENT_MODAL_PREFIX = "instagram:comment-modal:";
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
export declare function initInstagram(): void;
export declare function setInstagramChannel(guildId: string, channelId: string): void;
export declare function getInstagramChannel(guildId: string): string | null;
export declare function createPost(guildId: string, userId: string, channelId: string, imageUrl: string, caption?: string): number;
export declare function isImageAttachment(attachment: Attachment): boolean;
export declare function getImageAttachmentFromMessage(attachments: Iterable<Attachment>): Attachment | null;
export declare function getImageFromMessage(message: Message): {
    url: string;
    name: string;
    attachment: Attachment;
} | {
    url: string;
    name: string;
    attachment?: undefined;
} | null;
export declare function setPostMessageId(postId: number, messageId: string): void;
export declare function setPostImageUrl(postId: number, imageUrl: string): void;
export declare function downloadAttachment(attachment: Attachment): Promise<Buffer<ArrayBuffer>>;
export declare function getInstagramImageName(attachment: Attachment, postId: number): string;
export type InstagramImageUpload = {
    buffer: Buffer;
    name: string;
};
export declare function savePostImageFile(postId: number, buffer: Buffer, fileName: string): {
    path: string;
    name: string;
};
export declare function loadPostImageFile(postId: number): {
    buffer: Buffer;
    name: string;
} | null;
export declare function getPost(postId: number): InstagramPost | null;
export declare function getLikeCount(postId: number): number;
export declare function userHasLiked(postId: number, userId: string): boolean;
export declare function toggleLike(postId: number, userId: string): {
    liked: boolean;
    count: number;
};
export declare function addComment(postId: number, userId: string, content: string): void;
export declare function getCommentCount(postId: number): number;
export declare function getLikes(postId: number, limit?: number): InstagramLike[];
export declare function getComments(postId: number, limit?: number): InstagramComment[];
export declare function getUserStats(guildId: string, userId: string): {
    posts: number;
    likesReceived: number;
    likesGiven: number;
    comments: number;
};
export declare function parseInstagramId(customId: string, prefix: string): number | null;
export declare function buildInstagramPostContainer(post: InstagramPost, likeCount: number, imageUrl?: string): ContainerBuilder;
export declare function publishInstagramPost(channel: TextChannel, post: InstagramPost, imageUpload?: InstagramImageUpload): Promise<Message<true>>;
export declare function updateInstagramPostMessage(channel: TextChannel, post: InstagramPost, likeCount: number): Promise<void>;
export declare function formatLikesList(likes: InstagramLike[], total: number): string;
export declare function formatCommentsList(comments: InstagramComment[], total: number): string;
export declare function formatPostDetails(post: InstagramPost, likes: InstagramLike[], likeTotal: number, comments: InstagramComment[], commentTotal: number): string[];
//# sourceMappingURL=instagram.d.ts.map