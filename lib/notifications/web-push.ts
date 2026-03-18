// Stub for Web Push notifications — Round 2+

export async function sendWebPushNotification(
  _token: string,
  _title: string,
  _body: string
): Promise<boolean> {
  // TODO: Round 2 — implement web push via Web Push API
  console.log("Web Push stub: notification not sent");
  return false;
}

export async function subscribeToWebPush(
  _userId: string,
  _subscription: unknown
): Promise<boolean> {
  // TODO: Round 2 — store push subscription
  console.log("Web Push stub: subscription not saved");
  return false;
}
