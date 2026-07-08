const { Expo } = require('expo-server-sdk');
const prisma = require('../db');

const expo = new Expo();

/**
 * Create DB notifications for a list of userIds and, if they have a push
 * token registered, fire an Expo push notification as well.
 *
 * @param {number[]} userIds
 * @param {string}   message
 */
async function notifyUsers(userIds, message) {
  if (!userIds.length) return;

  // 1. Persist in DB (deduplicated by Prisma skipDuplicates)
  await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, message })),
    skipDuplicates: true,
  });

  // 2. Collect valid push tokens for the given users
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, pushToken: { not: null } },
    select: { pushToken: true },
  });

  const messages = users
    .filter(u => Expo.isExpoPushToken(u.pushToken))
    .map(u => ({
      to: u.pushToken,
      sound: 'default',
      title: 'Family Finance',
      body: message,
      data: { message },
    }));

  if (!messages.length) return;

  // 3. Send in batches (Expo limit: 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error('Push notification send error:', err.message);
    }
  }
}

module.exports = { notifyUsers };
