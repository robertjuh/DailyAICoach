// Stub for Firebase Cloud Messaging — Round 2+

export async function sendFCMNotification(
  _token: string,
  _title: string,
  _body: string
): Promise<boolean> {
  // TODO: Round 2 — implement FCM push notification
  console.log("FCM stub: notification not sent");
  return false;
}

export async function registerFCMToken(
  _userId: string,
  _token: string
): Promise<boolean> {
  // TODO: Round 2 — store FCM token in push_tokens table
  console.log("FCM stub: token not registered");
  return false;
}
