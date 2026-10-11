import { useEffect, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import {
  CometChatProvider,
  CometChatConversations,
  CometChatGroups,
  CometChatUsers,
  CometChatMessageHeader,
  CometChatMessageList,
  CometChatMessageComposer,
} from "@cometchat/chat-uikit-react";

type Tab = "projects" | "dms" | "people";
type Selection = { user?: CometChat.User; group?: CometChat.Group };

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return isMobile;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "projects", label: "Projects", icon: "#" },
  { id: "dms", label: "Direct", icon: "💬" },
  { id: "people", label: "People", icon: "👥" },
];

export default function ChatShell({ user, onLogout }: { user: CometChat.User; onLogout: () => void }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("projects");
  const [selection, setSelection] = useState<Selection>({});
  const hasSelection = Boolean(selection.user || selection.group);

  const openUser = (u: CometChat.User) => setSelection({ user: u });
  const openGroup = (g: CometChat.Group) => setSelection({ group: g });
  const openConversation = (c: CometChat.Conversation) => {
    const entity = c.getConversationWith();
    if (c.getConversationType() === "user") openUser(entity as CometChat.User);
    else openGroup(entity as CometChat.Group);
  };

  const showSidebar = !isMobile || !hasSelection;
  const showPane = !isMobile || hasSelection;

  return (
    <CometChatProvider theme="dark">
      <div className="shell">
        {showSidebar && (
          <aside className="sidebar">
            <header className="sidebar-top">
              <div className="brand">
                <span className="brand-mark small" aria-hidden>⚡</span>
                <strong>DevConnect</strong>
              </div>
              <div className="me">
                <span className="me-name" title={user.getUid()}>{user.getName()}</span>
                <button className="ghost" onClick={onLogout}>Sign out</button>
              </div>
            </header>

            <nav className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? "tab active" : "tab"}
                  onClick={() => setTab(t.id)}
                >
                  <span aria-hidden>{t.icon}</span> {t.label}
                </button>
              ))}
            </nav>

            <div className="sidebar-list">
              {tab === "projects" && (
                <CometChatGroups
                  activeGroup={selection.group}
                  onItemClick={openGroup}
                  groupsRequestBuilder={new CometChat.GroupsRequestBuilder().setLimit(30).joinedOnly(true)}
                />
              )}
              {tab === "dms" && <CometChatConversations onItemClick={openConversation} />}
              {tab === "people" && <CometChatUsers onItemClick={openUser} />}
            </div>
          </aside>
        )}

        {showPane && (
          <main className="pane">
            {hasSelection ? (
              <>
                <CometChatMessageHeader
                  user={selection.user}
                  group={selection.group}
                  hideBackButton={!isMobile}
                  onBack={() => setSelection({})}
                />
                <CometChatMessageList user={selection.user} group={selection.group} />
                <CometChatMessageComposer user={selection.user} group={selection.group} />
              </>
            ) : (
              <div className="empty">
                <div className="brand-mark" aria-hidden>⚡</div>
                <h2>Pick a project channel</h2>
                <p className="muted">
                  Choose a channel on the left, or open the People tab to message a teammate directly.
                </p>
              </div>
            )}
          </main>
        )}
      </div>
    </CometChatProvider>
  );
}
