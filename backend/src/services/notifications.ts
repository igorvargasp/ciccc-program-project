import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { emitTo, room, RT } from "../realtime/io.js";

export interface NewNotification {
  userId: string;
  type: "match" | "news" | "result";
  title: string;
  body?: string;
}

/**
 * Persist a notification and push it to the user in real time.
 * Returns the stored row so callers can include it in an HTTP response.
 */
export async function createNotification(input: NewNotification) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
    })
    .returning();

  emitTo(room.user(input.userId), RT.NOTIFICATION_NEW, row);
  return row;
}

/** Fan a notification out to many users (e.g. all followers of a team). */
export async function notifyMany(userIds: string[], base: Omit<NewNotification, "userId">) {
  return Promise.all(userIds.map((userId) => createNotification({ userId, ...base })));
}
