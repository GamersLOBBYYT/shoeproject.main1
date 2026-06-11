import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WishlistContext = createContext(null);

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem("sole-wishlist")) || [];
  } catch (e) {
    console.error("Failed to parse stored wishlist, starting empty:", e);
    return [];
  }
};

const toggled = (prev, productId) =>
  prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId];

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState(loadLocal);
  const synced = useRef(false);

  // Guest persistence (localStorage)
  useEffect(() => {
    if (!user) localStorage.setItem("sole-wishlist", JSON.stringify(ids));
  }, [ids, user]);

  // On login: merge local wishlist into the account; server becomes source of truth
  useEffect(() => {
    if (!user) {
      synced.current = false;
      return undefined;
    }
    if (synced.current) return undefined;
    synced.current = true;
    let cancelled = false;
    (async () => {
      try {
        const local = loadLocal();
        const { data } = local.length
          ? await api.post("/wishlist/merge", { product_ids: local })
          : await api.get("/wishlist");
        if (!cancelled) {
          setIds(data.product_ids);
          localStorage.setItem("sole-wishlist", "[]");
        }
      } catch (e) {
        console.error("Wishlist sync failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (productId) => {
      setIds((prev) => toggled(prev, productId)); // optimistic for both modes
      if (!user) return;
      try {
        const { data } = await api.post("/wishlist/toggle", { product_id: productId });
        setIds(data.product_ids);
      } catch (e) {
        console.error("Wishlist toggle failed, reverting:", e);
        setIds((prev) => toggled(prev, productId));
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({ ids, has: (id) => ids.includes(id), toggle, count: ids.length }),
    [ids, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
