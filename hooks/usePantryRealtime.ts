import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ─── Singleton subscription ───────────────────────────────────────────────────
// A single Supabase channel is shared across all mounted hooks to avoid
// duplicate subscriptions. subscriberCount tracks how many components are
// currently mounted so we can tear down the channel when the last one unmounts.
//
// IMPORTANT: We intentionally do NOT pass a server-side `filter:` to the
// postgres_changes listener.  Supabase evaluates row-level filters against the
// replication identity of the table.  When the table uses the default identity
// (primary key only), INSERT events can be silently dropped for filters on
// non-PK columns such as `user_id`.  Instead we verify `user_id` client-side
// inside the callback so every INSERT / UPDATE / DELETE event is guaranteed to
// reach the handler.
//
// ─── Callback registry ────────────────────────────────────────────────────────
// Each subscriber (Dashboard, Pantry, Recipes, …) passes its OWN invalidation
// callback.  We keep a Set of those callbacks so EVERY mounted screen is
// notified on every realtime event — not just the first subscriber (which was
// the original bug).
// ─────────────────────────────────────────────────────────────────────────────

let subscriberCount = 0;
let teardown: (() => void) | null = null;
// One callback entry per mounted subscriber screen.
const callbackRegistry = new Set<() => void>();

function startPantryRealtime(): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  void supabase.auth.getUser().then(({ data: { user } }) => {
    if (cancelled || user == null) return;

    const currentUserId = user.id;

    channel = supabase
      .channel(`pantry_items_realtime:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          // Listen for ALL event types so INSERT events are never missed.
          event: '*',
          schema: 'public',
          table: 'pantry_items',
          // ⚠️  No server-side `filter` here — see module-level comment above.
          //    User-id guard is applied client-side below.
        },
        (payload) => {
          // Client-side user_id guard — ignore changes that belong to other users.
          const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
          if (row?.['user_id'] !== currentUserId) return;

          for (const cb of callbackRegistry) {
            cb();
          }
        },
      )
      .subscribe();
  });

  return () => {
    cancelled = true;
    if (channel != null) {
      void supabase.removeChannel(channel);
      channel = null;
    }
  };
}

/**
 * Subscribes to pantry_items realtime events.
 *
 * @param onEvent  Called whenever an INSERT / UPDATE / DELETE fires for the
 *                 current user's pantry_items rows.  Each screen should pass
 *                 its OWN invalidation logic here (e.g. Recipes invalidates
 *                 EXPIRING_ITEMS_QUERY_KEY, Dashboard / Pantry invalidate
 *                 PANTRY_ITEMS_QUERY_KEY).  The shared Supabase channel remains
 *                 a singleton — only the callbacks differ per subscriber.
 */
export function usePantryRealtime(onEvent: () => void): void {
  // Keep a ref so the stable callback wrapper always calls the latest closure
  // without the effect needing to re-run when onEvent identity changes.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    subscriberCount += 1;

    // Register a stable wrapper that always delegates to the latest ref value.
    const stableCallback = () => onEventRef.current();
    callbackRegistry.add(stableCallback);

    if (teardown == null) {
      teardown = startPantryRealtime();
    }

    return () => {
      callbackRegistry.delete(stableCallback);
      subscriberCount -= 1;

      if (subscriberCount === 0 && teardown != null) {
        teardown();
        teardown = null;
      }
    };
    // Empty deps: the ref handles callback freshness; count/registry are module-level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
