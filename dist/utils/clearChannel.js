"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearChannelMessages = clearChannelMessages;
exports.clearUserMessages = clearUserMessages;
const BULK_DELETE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const OLD_MESSAGE_DELAY_MS = 350;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isBulkDeletable(message) {
    return Date.now() - message.createdTimestamp < BULK_DELETE_MAX_AGE_MS;
}
async function clearChannelMessages(channel) {
    let deleted = 0;
    let failed = 0;
    while (true) {
        const fetched = await channel.messages.fetch({ limit: 100 });
        if (fetched.size === 0)
            break;
        const bulkDeletable = fetched.filter(isBulkDeletable);
        if (bulkDeletable.size > 0) {
            const removed = await channel.bulkDelete(bulkDeletable, true);
            deleted += removed.size;
        }
        const oldMessages = fetched.filter((message) => !isBulkDeletable(message));
        for (const message of oldMessages.values()) {
            try {
                await message.delete();
                deleted++;
            }
            catch {
                failed++;
            }
            await sleep(OLD_MESSAGE_DELAY_MS);
        }
        if (fetched.size < 100)
            break;
    }
    return { deleted, failed };
}
async function clearUserMessages(channel, userId) {
    let deleted = 0;
    let failed = 0;
    let before;
    while (true) {
        const fetched = await channel.messages.fetch({ limit: 100, before });
        if (fetched.size === 0)
            break;
        const userMessages = fetched.filter((message) => message.author.id === userId);
        const bulkDeletable = userMessages.filter(isBulkDeletable);
        if (bulkDeletable.size > 0) {
            const removed = await channel.bulkDelete(bulkDeletable, true);
            deleted += removed.size;
        }
        for (const message of userMessages
            .filter((entry) => !isBulkDeletable(entry))
            .values()) {
            try {
                await message.delete();
                deleted++;
            }
            catch {
                failed++;
            }
            await sleep(OLD_MESSAGE_DELAY_MS);
        }
        const lastMessage = fetched.last();
        if (!lastMessage)
            break;
        before = lastMessage.id;
        if (fetched.size < 100)
            break;
    }
    return { deleted, failed };
}
//# sourceMappingURL=clearChannel.js.map