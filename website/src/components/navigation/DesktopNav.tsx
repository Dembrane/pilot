'use client';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import PhosphorIcon from '@/components/icons/PhosphorIcon';
import Link from 'next/link';
import { NavigationItem, Product } from '@/lib/services/navigation';
import LanguageSelection from '../LanguageSelection';
import { GlobeIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import React from "react";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

interface DesktopNavProps {
  navigationItems: NavigationItem[];
  products: Product[];
}

export function DesktopNav({ navigationItems, products }: DesktopNavProps) {
  const { i18n } = useLingui();
    
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {navigationItems.map((item) => (
          <NavigationMenuItem key={item.id}>
            {item.children && item.children.length > 0 ? (
              <>
                <NavigationMenuTrigger>
                  <span className="flex items-center gap-2">
                    {item.icon && <PhosphorIcon name={item.icon} />}
                    {item.label}
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[min(400px,90vw)] gap-3 p-4 md:w-[min(500px,90vw)] md:grid-cols-2 lg:w-[min(600px,90vw)]">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={child.url}
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground"
                          >
                            <div className="text-sm font-medium leading-none">
                              {child.label}
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <Link href={item.url} legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {item.label}
                </NavigationMenuLink>
              </Link>
            )}
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <span className="flex items-center gap-2">
              <PhosphorIcon name="Package" />
              {i18n._(t({ id: 'products' }))}
            </span>
          </NavigationMenuTrigger>
          <DesktopProductMenu products={products} />
        </NavigationMenuItem>
        <LanguageSelection>
          {({
            currentLocale,
            availableLocales,
            onLanguageChange,
            getLanguageLabel,
          }) => (
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2">
                <PhosphorIcon name="Globe" />
                {i18n._(t({ id: 'language' }))}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(200px,90vw)] gap-2 p-2">
                  {availableLocales.map((locale) => (
                    <li key={locale}>
                      <NavigationMenuLink asChild>
                        <button
                          onClick={() => onLanguageChange(locale)}
                          className="block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground"
                        >
                          <div className="">{getLanguageLabel(locale)}</div>
                        </button>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
        </LanguageSelection>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function DesktopProductMenu({ products }: { products: Product[] }) {
  const [featuredProduct, setFeaturedProduct] = React.useState<Product>(products[0]);

  if (!products?.length) {
    return null;
  }

  return (
    <NavigationMenuContent>
      <div className="grid w-[600px] grid-cols-[auto_1fr] gap-4 p-4">
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id}>
              <NavigationMenuLink asChild>
                <Link
                  href={product.url}
                  className="block select-none rounded-md p-3 no-underline outline-none transition-colors hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground"
                  onMouseEnter={() => setFeaturedProduct(product)}
                >
                  <div className="text-sm font-medium leading-none">
                    {product.label}
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>

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
                    width: '100%',
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
                  <p className="absolute right-2 top-2 rounded-full bg-accent px-4 py-2 text-accent-foreground shadow-md">
                    {featuredProduct.type}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <p className="text-2xl">
              {featuredProduct.headline || 'No description available'}
            </p>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  );
}
