/**
 * usePusherDelivery — real-time delivery status subscription hook
 *
 * Architecture:
 *  • Uses Pusher Channels (free Sandbox tier: 200k msgs/day, 100 concurrent connections).
 *  • The Django backend already calls `pusher_client.trigger(channel, event, data)` in
 *    views.py whenever a delivery status changes.
 *  • This hook subscribes to two channels simultaneously:
 *    1. `pharmacy-<pharmacyId>` — scoped to the user's pharmacy tenant
 *    2. `pharmadrop-global`     — cross-tenant broadcasts (customers, unscoped views)
 *  • Events handled: delivery_created, delivery_assigned, status_updated,
 *    delivery_completed, delivery_cancelled, code_failed
 *  • On any event, the `onUpdate(deliveryData)` callback fires with the full delivery
 *    object. The calling component decides how to merge it into local state.
 *
 * Free Pusher Sandbox:
 *  • No credit card required — sign up at https://pusher.com
 *  • 200 concurrent connections, 200k messages/day
 *  • Replace the VITE_PUSHER_* env vars below with your own credentials.
 *
 * SSE Fallback:
 *  • If Pusher is not configured (no VITE_PUSHER_KEY), hook returns a no-op
 *    and a pollingEnabled flag so components can fall back to 30-second polling.
 */
import { useEffect, useRef } from 'react';

const PUSHER_KEY    = import.meta.env.VITE_PUSHER_KEY    || null;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

const DELIVERY_EVENTS = [
  'delivery_created',
  'delivery_assigned',
  'status_updated',
  'delivery_completed',
  'delivery_cancelled',
  'code_failed',
];

/**
 * @param {object}   options
 * @param {string}   [options.pharmacyId]  - pharmacy UUID to subscribe to tenant channel
 * @param {function} options.onUpdate      - called with (deliveryData, eventName) on any event
 * @returns {{ connected: boolean, pollingEnabled: boolean }}
 */
export const usePusherDelivery = ({ pharmacyId, onUpdate }) => {
  const pusherRef   = useRef(null);
  const channelsRef = useRef([]);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref fresh without re-subscribing
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    if (!PUSHER_KEY) {
      // No Pusher key configured — caller will use polling fallback
      return;
    }

    let cancelled = false;

    const initPusher = async () => {
      try {
        const PusherLib = (await import('pusher-js')).default;

        if (cancelled) return;

        const client = new PusherLib(PUSHER_KEY, {
          cluster: PUSHER_CLUSTER,
          forceTLS: true,
          authEndpoint: `${import.meta.env.VITE_API_BASE_URL || '/api'}/pusher/auth/`,
          auth: {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
          },
        });

        pusherRef.current = client;

        const channelNames = pharmacyId ? [`private-pharmacy-${pharmacyId}`] : [];

        channelsRef.current = channelNames.map((name) => {
          const ch = client.subscribe(name);
          DELIVERY_EVENTS.forEach((event) => {
            ch.bind(event, (data) => {
              if (!cancelled) onUpdateRef.current?.(data, event);
            });
          });
          return ch;
        });
      } catch (err) {
        console.warn('[Pusher] Connection failed — falling back to polling:', err?.message);
      }
    };

    initPusher();

    return () => {
      cancelled = true;
      channelsRef.current.forEach((ch) => {
        DELIVERY_EVENTS.forEach((e) => ch.unbind(e));
        pusherRef.current?.unsubscribe(ch.name);
      });
      pusherRef.current?.disconnect();
      pusherRef.current = null;
      channelsRef.current = [];
    };
  }, [pharmacyId]);

  return {
    connected: !!pusherRef.current,
    pollingEnabled: !PUSHER_KEY, // true when Pusher is not configured → use 30s interval polling
  };
};
