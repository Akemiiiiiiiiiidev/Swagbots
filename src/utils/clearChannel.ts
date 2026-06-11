import { Message, TextChannel } from "discord.js";
const BULK_DELETE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const OLD_MESSAGE_DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBulkDeletable(message: Message) {
  return Date.now() - message.createdTimestamp < BULK_DELETE_MAX_AGE_MS;
}

export async function clearChannelMessages(channel: TextChannel) {
  let deleted = 0;
  let failed = 0;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100 });
    if (fetched.size === 0) break;

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
      } catch {
        failed++;
      }

      await sleep(OLD_MESSAGE_DELAY_MS);
    }

    if (fetched.size < 100) break;
  }

  return { deleted, failed };
}

export async function clearUserMessages(channel: TextChannel, userId: string) {
  let deleted = 0;
  let failed = 0;
  let before: string | undefined;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before });
    if (fetched.size === 0) break;

    const userMessages = fetched.filter(
      (message) => message.author.id === userId
    );
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
      } catch {
        failed++;
      }

      await sleep(OLD_MESSAGE_DELAY_MS);
    }

    const lastMessage = fetched.last();
    if (!lastMessage) break;

    before = lastMessage.id;
    if (fetched.size < 100) break;
  }

  return { deleted, failed };
}
