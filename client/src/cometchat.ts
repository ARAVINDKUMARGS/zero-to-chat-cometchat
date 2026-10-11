import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";
import type { PublicConfig } from "./api";
import type { ChatUser } from "./types";

// NOTE: no Auth Key anywhere. We only use App ID + Region (public values) and a
// per-user Auth Token minted by our server.
let initPromise: Promise<ChatUser | null> | null = null;

/** Initialise the SDK once. Resolves with the user if a session already exists. */
export function initChat(cfg: PublicConfig) {
  if (!initPromise) {
    const settings = new UIKitSettingsBuilder()
      .setAppId(cfg.appId)
      .setRegion(cfg.region)
      .subscribePresenceForAllUsers() // enables online/offline presence events
      .build();
    initPromise = CometChatUIKit.init(settings).catch((err) => {
      initPromise = null; // allow retry
      throw err;
    });
  }
  return initPromise;
}

export function loginWithToken(authToken: string) {
  return CometChatUIKit.loginWithAuthToken(authToken);
}

export function logout() {
  return CometChatUIKit.logout();
}
