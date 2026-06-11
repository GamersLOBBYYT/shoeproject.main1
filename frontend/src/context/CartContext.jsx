import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

const load = () => {
  try {
    return JSON.parse(localStorage.getItem("sole-cart")) || [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(load);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sole-cart", JSON.stringify(items));
  }, [items]);

  const keyOf = (productId, colorName) => `${productId}__${colorName}`;

  const addItem = (product, color) => {
    const key = keyOf(product.id, color.name);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          color,
          quantity: 1,
        },
      ];
    });
  };

  const updateQty = (key, delta) => {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, count, subtotal, cartOpen, setCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
