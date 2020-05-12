import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productAsync = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      setProducts(!!productAsync && JSON.parse(productAsync));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateStoredProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateStoredProducts();
  }, [products]);

  const addToCart = useCallback(
    async ({ id, title, image_url, price }: Omit<Product, 'quantity'>) => {
      const productExist = products.find(product => product.id === id);

      if (!productExist) {
        setProducts(oldProductList => [
          ...oldProductList,
          { id, title, image_url, price, quantity: 1 },
        ]);

        return;
      }

      const updatedProducts = products.map(itemProduct => {
        if (itemProduct.id !== id) return itemProduct;

        const updatedProduct = {
          ...itemProduct,
          quantity: itemProduct.quantity + 1,
        };

        return updatedProduct;
      });

      setProducts(updatedProducts);
    },
    [products],
  );

  const increment = useCallback(
    async (id: string) => {
      const updatedProducts = products.map(itemProduct => {
        if (itemProduct.id !== id) return itemProduct;

        const updatedProduct = {
          ...itemProduct,
          quantity: itemProduct.quantity + 1,
        };

        return updatedProduct;
      });

      setProducts(updatedProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async (id: string) => {
      const updatedProducts = products
        .map(itemProduct => {
          if (itemProduct.id !== id) return itemProduct;

          const updatedProduct = {
            ...itemProduct,
            quantity: itemProduct.quantity - 1,
          };

          return updatedProduct;
        })
        .filter(itemProduct => itemProduct.quantity > 0);

      setProducts(updatedProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
