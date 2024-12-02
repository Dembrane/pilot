'use client';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import PhosphorIcon from '@/components/icons/PhosphorIcon';
import Link from 'next/link';
import { NavigationItem, NavigationProduct } from '@/lib/services/navigation';
import LanguageSelection from '../LanguageSelection';
import { GlobeIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import React from 'react';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import { BackgroundToggle } from '@/components/settings/BackgroundToggle';
import { MotionDiv } from '@components/animations/MotionComponents';

interface DesktopNavProps {
  navigationItems: NavigationItem[];
  products: NavigationProduct[];
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
                    {item.phosphor_icon && (
                      <PhosphorIcon name={item.phosphor_icon} />
                    )}
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
                            <div className="flex items-center gap-2 text-sm leading-none">
                              {child.phosphor_icon && (
                                <PhosphorIcon
                                  name={child.phosphor_icon}
                                  className="shrink-0"
                                />
                              )}
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
                  <span className="flex items-center gap-2">
                    {item.phosphor_icon && (
                      <PhosphorIcon name={item.phosphor_icon} />
                    )}
                    {item.label}
                  </span>
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
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <span className="flex items-center gap-2">
              <PhosphorIcon name="Gear" />
              {i18n._(t({ id: 'Settings' }))}
            </span>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[min(300px,90vw)] space-y-4 p-4">
              <LanguageSelection>
                {({
                  currentLocale,
                  availableLocales,
                  onLanguageChange,
                  getLanguageLabel,
                }) => (
                  <div className="space-y-2">
                    <div className="font-medium">
                      {i18n._(t({ id: 'Language' }))}
                    </div>
                    <ul className="space-y-1">
                      {availableLocales.map((locale) => (
                        <li key={locale}>
                          <button
                            onClick={() => onLanguageChange(locale)}
                            className={`w-full rounded-md p-2 text-left transition-colors hover:bg-secondary hover:text-secondary-foreground ${
                              currentLocale === locale
                                ? 'bg-secondary text-secondary-foreground'
                                : ''
                            }`}
                          >
                            {getLanguageLabel(locale)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </LanguageSelection>

              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{i18n._(t({ id: 'Theme' }))}</div>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">
                  {i18n._(t({ id: 'Simulation' }))}
                </div>
                <BackgroundToggle />
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function DesktopProductMenu({ products }: { products: NavigationProduct[] }) {
  const [featuredProduct, setFeaturedProduct] =
    React.useState<NavigationProduct>(
      // @ts-ignore
      products[0],
      // idk why this gives a type error. can products[0] be undefined? surely this should be caught by the invocation
    );

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

        <Link href={featuredProduct.url} className="flex flex-col space-y-4">
          <div className="relative h-[180px] overflow-hidden rounded-md">
            <AnimatePresence>
              {products.map((product) => (
                <MotionDiv
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
                    alt={product.label ?? ''}
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
                </MotionDiv>
              ))}
            </AnimatePresence>
          </div>
          <div className="space-y-2">
            <p className="text-2xl">
              {featuredProduct.headline || 'No description available'}
            </p>
          </div>
        </Link>
      </div>
    </NavigationMenuContent>
  );
}
