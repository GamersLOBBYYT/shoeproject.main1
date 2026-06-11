import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2000;

/**
 * Polls the Stripe checkout status endpoint until paid/expired/timeout.
 * Returns { state: "checking"|"success"|"expired"|"timeout"|"error", orderId }.
 * When no sessionId is given (demo payment path), state starts as "success".
 */
export function useStripePolling(sessionId, onPaid) {
  const [state, setState] = useState(sessionId ? "checking" : "success");
  const [orderId, setOrderId] = useState(null);
  const started = useRef(false);
  const onPaidRef = useRef(onPaid);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    if (!sessionId || started.current) return undefined;
    started.current = true;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setState("timeout");
        return;
      }
      attempts += 1;
      try {
        const { data } = await api.get(`/checkout/status/${sessionId}`);
        if (cancelled) return;
        if (data.payment_status === "paid") {
          setOrderId(data.order_id);
          onPaidRef.current?.();
          setState("success");
          return;
        }
        if (data.status === "expired") {
          setState("expired");
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (e) {
        console.error("Payment status check failed:", e);
        if (!cancelled) setState("error");
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return { state, orderId };
}
