'use client';

import { NavigationMenuContent, NavigationMenuLink } from "@/components/ui/navigation-menu"
import Image from 'next/image'
import Link from 'next/link'
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus'
import { motion, AnimatePresence } from "framer-motion"
import React from 'react'
import { useLingui } from "@lingui/react";
import { i18n } from "@lingui/core";
import { t } from '@lingui/macro';

type Product = {
  id: string;
  url: string;
  cover?: string;
  label: string;
  description?: string;
  headline?: string;
};

type ProductMenuProps = {
  products: Product[];
}

export function ProductMenu({ products }: ProductMenuProps) {
  const { i18n } = useLingui();
  const [featuredProduct, setFeaturedProduct] = React.useState<Product>(products[0]);

  if (!products?.length) {
    return (
      <NavigationMenuContent>
        <div className="p-4 text-center text-muted-foreground">
          No products available
        </div>
      </NavigationMenuContent>
    );
  }

  const updateFeaturedProduct = (product: Product) => {
    setFeaturedProduct(product);
  };

  return (
    <NavigationMenuContent>
      <div className="grid w-[600px] grid-cols-[auto_1fr] gap-4 p-4">
        {/* Product List Column */}
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id}>
              <NavigationMenuLink asChild>
                <Link
                  href={product.url}
                  className="block select-none rounded-md p-3 no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onMouseEnter={() => updateFeaturedProduct(product)}
                >
                  <div className="text-sm font-medium leading-none">
                    {product.label}
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>

        {/* Featured Product Column */}
        <div className="flex flex-col space-y-4">
          <div className="relative h-[180px] overflow-hidden rounded-md">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: product.id === featuredProduct.id ? 1 : 0,
                    zIndex: product.id === featuredProduct.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: '100%'
                  }}
                >
                  <Image
                    src={
                      product.cover
                        ? `${DIRECTUS_PUBLIC_ASSETS_URL}${product.cover}`
                        : '/placeholder-image.jpg'
                    }
                    alt={product.label}
                    width={320}
                    height={180}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = '/placeholder-image.jpg';
                    }}
                    priority={product.id === featuredProduct.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {featuredProduct.headline || 'No description available'}
            </p>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  );
}
