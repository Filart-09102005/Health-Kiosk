import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { authService } from "../../Auth/services/authService";

/**
 * The user's notifications, read from the server.
 *
 * These used to be recomputed in the browser from whatever metrics the current
 * page happened to hold, with the read flag in sessionStorage. Three things
 * were wrong with that and all three are fixed by asking the server instead:
 *
 *  - signing out wiped the list, because sessionStorage went with it;
 *  - the bell and the notifications page each kept their own idea of what had
 *    been read, so the badge count disagreed with the list;
 *  - a notification could not be older than the page you were looking at.
 *
 * `read_at` now lives in the database, so an unread mark is one fact with one
 * owner.
 */

// Fired after any change, so a bell rendered on another screen re-reads the
// count without waiting for a navigation.
export const NOTIFICATIONS_CHANGED_EVENT = "hk-notifications-changed";

export function notifyNotificationsChanged() {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

export function useNotifications() {
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const aliveRef = useRef(false);
    const itemsRef = useRef([]);

    itemsRef.current = items;

    const apply = useCallback((payload) => {
        const list = payload?.notifications || [];
        setItems(list);
        setUnreadCount(
            typeof payload?.unread_count === "number"
                ? payload.unread_count
                : list.filter((item) => !item.read).length,
        );
    }, []);

    const refresh = useCallback(
        async (signal) => {
            try {
                const response = await authService.notifications(signal);
                if (!aliveRef.current) return;
                apply(response.data);
                setError(null);
            } catch (requestError) {
                if (axios.isCancel(requestError) || requestError?.code === "ERR_CANCELED") return;
                if (!aliveRef.current) return;
                setError(requestError);
            } finally {
                if (aliveRef.current) setLoading(false);
            }
        },
        [apply],
    );

    useEffect(() => {
        // Raised in setup, not only lowered in cleanup: under StrictMode the
        // mount/cleanup/mount cycle would otherwise leave it permanently false
        // and every guarded setState would be skipped.
        aliveRef.current = true;

        const controller = new AbortController();
        refresh(controller.signal);

        const onChanged = () => refresh();
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);

        return () => {
            aliveRef.current = false;
            controller.abort();
            window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
        };
    }, [refresh]);

    /** Mark one notification read — only ever called when it is actually opened. */
    const markRead = useCallback(async (id) => {
        const key = String(id);
        // Read from the ref, not from a state updater: a setState callback has
        // not run yet by the time the next line executes, so deciding "was it
        // already read" inside one would always see the stale answer.
        const target = itemsRef.current.find((item) => String(item.id) === key);
        if (!target || target.read) return;

        setItems((current) =>
            current.map((item) => (String(item.id) === key ? { ...item, read: true } : item)),
        );
        setUnreadCount((current) => Math.max(0, current - 1));

        try {
            const response = await authService.markNotificationsRead([id]);
            if (typeof response?.data?.unread_count === "number") {
                setUnreadCount(response.data.unread_count);
            }
        } catch {
            // The optimistic mark stands for this screen; the next refresh
            // reconciles it against the server.
        }

        notifyNotificationsChanged();
    }, []);

    const markAllRead = useCallback(async () => {
        setItems((current) => current.map((item) => (item.read ? item : { ...item, read: true })));
        setUnreadCount(0);

        try {
            await authService.markAllNotificationsRead();
        } catch {
            /* same as above */
        }

        notifyNotificationsChanged();
    }, []);

    return { items, unreadCount, loading, error, refresh, markRead, markAllRead };
}
