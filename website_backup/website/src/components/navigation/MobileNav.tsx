'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import PhosphorIcon from '@/components/icons/PhosphorIcon';
import Link from 'next/link';
import { NavigationItem, Product } from '@/lib/services/navigation';
import { ThemeToggle } from '../settings/ThemeToggle';
import LanguageSelection from '../LanguageSelection';
import { GlobeIcon } from '@radix-ui/react-icons';
import { BackgroundToggle } from '@/components/settings/BackgroundToggle';
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

interface MobileNavProps {
  navigationItems: NavigationItem[];
  products: Product[];
}

export function MobileNav({ navigationItems, products }: MobileNavProps) {
  const { i18n } = useLingui();

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 w-10 px-0"
            aria-label="Open menu"
          >
            <PhosphorIcon name="List" className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-8 flex flex-col gap-4">
            {/* Main Navigation Items */}
            {navigationItems.map((item) => (
              <div key={item.id}>
                {item.children && item.children.length > 0 ? (
                  <Accordion type="single" collapsible>
                    <AccordionItem value={item.id} className="border-none">
                      <AccordionTrigger className="rounded-md px-4 py-2 hover:bg-secondary hover:text-secondary-foreground hover:no-underline mb-2">
                        <span className="flex items-center gap-2">
                          {item.icon && <PhosphorIcon name={item.icon} />}
                          {item.label}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-2 pl-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
                              href={child.url}
                              className="rounded-md px-4 py-2 text-sm hover:bg-secondary hover:text-secondary-foreground"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <Link
                    href={item.url}
                    className="flex items-center gap-2 rounded-md px-4 py-2 hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {item.icon && <PhosphorIcon name={item.icon} />}
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Products Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="products" className="border-none">
                <AccordionTrigger className="rounded-md px-4 py-2 hover:bg-secondary hover:text-secondary-foreground hover:no-underline mb-2">
                  <span className="flex items-center gap-2">
                    <PhosphorIcon name="Package" />
                    Products
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <MobileProductMenu products={products} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Settings Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="settings" className="border-none">
                <AccordionTrigger className="mb-2 rounded-md px-4 py-2 hover:bg-secondary hover:text-secondary-foreground hover:no-underline">
                  <span className="flex items-center gap-2">
                    <PhosphorIcon name="Gear" />
                    {i18n._(t`Settings`)}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4 px-4">
                    {/* Language Settings */}
                    <Accordion type="single" collapsible>
                      <AccordionItem value="language" className="border-none">
                        <AccordionTrigger className="mb-2 py-2 hover:no-underline">
                          <span className="flex items-center gap-2">
                            <GlobeIcon className="h-4 w-4" />
                            {i18n._(t`Language`)}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <LanguageSelection>
                            {({
                              currentLocale,
                              availableLocales,
                              onLanguageChange,
                              getLanguageLabel,
                            }) => (
                              <div className="space-y-2">
                                {availableLocales.map((locale) => (
                                  <button
                                    key={locale}
                                    onClick={() => onLanguageChange(locale)}
                                    className={`block w-full rounded-md p-2 text-left text-sm hover:bg-secondary hover:text-secondary-foreground ${
                                      currentLocale === locale
                                        ? 'bg-accent text-accent-foreground'
                                        : ''
                                    }`}
                                  >
                                    {getLanguageLabel(locale)}
                                  </button>
                                ))}
                              </div>
                            )}
                          </LanguageSelection>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Theme Settings */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 justify-between">
                        {i18n._(t`Theme`)}

                        <ThemeToggle />
                      </div>
                    </div>

                    {/* Background Settings */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 justify-between">
                        {i18n._(t`Simulation`)}

                        <BackgroundToggle />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileProductMenu({ products }: { products: Product[] }) {
  return (
    <div className="flex flex-col gap-2 pl-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={product.url}
          className="rounded-md px-4 py-2 text-sm hover:bg-secondary"
        >
          {product.label}
        </Link>
      ))}
    </div>
  );
} 