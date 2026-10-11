import type { CometChatUIKit } from "@cometchat/chat-uikit-react";

/** The logged-in CometChat user object (derived from the UI Kit so versions always match). */
export type ChatUser = Awaited<ReturnType<typeof CometChatUIKit.loginWithAuthToken>>;
