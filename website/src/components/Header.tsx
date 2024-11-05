import Link from 'next/link';
import LanguageSwitcher from './LanguageSelection';
import { client, DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getGlobalsByLang } from '@lib/globals';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Image from 'next/image'
import { ProductMenu } from '@/components/ProductMenu';

type NavigationItem = {
  id: string;
  url: string;
  label: string;
  children?: NavigationItem[];
};

type Product = {
  id: string;
  slug: string;
  name: string;
  cover?: string;
  description?: string;
  translations: Array<{
    languages_code: string;
    name: string;
    description?: string;
    headline?: string;
  }>;
};

async function getNavigationItems(lang: string) {
  try {
    const response = await client.request<any[]>(
      readItems('navigation', {
        filter: {
          id: {
            _eq: 'main',
          },
        },
        fields: [
          '*',
          'translations.*',
          'items.*',
          'items.navigation_items_id.*',
          'items.navigation_items_id.translations.*',
          'items.navigation_items_id.children.*',
          'items.navigation_items_id.children.translations.*'
        ],
      })
    );

    if (response && response.length > 0) {
      const navigation = response[0];
      return navigation.items.map((item: any) => ({
        id: item.navigation_items_id.id,
        url: item.navigation_items_id.url || '',
        label: item.navigation_items_id.translations?.find(
          (t: any) => t.languages_code === lang
        )?.label || '',
        children: item.navigation_items_id.children?.map((child: any) => ({
          id: child.id,
          url: child.url || '',
          label: child.translations?.find(
            (t: any) => t.languages_code === lang
          )?.label || '',
        })) || undefined,
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }
}

async function getProducts(lang: string) {
  try {
    const products = await client.request(
      readItems('products', {
        fields: [
          'id',
          'slug',
          'name',
          'cover',
          'description',
          'translations.*'
        ],
      })
    );

    return products.map((product: any) => ({
      id: product.id,
      url: `/products/${product.slug}`,
      cover: product.cover,
      label: product.translations?.find(t => t.languages_code === lang)?.name || product.name,
      description: product.translations?.find(t => t.languages_code === lang)?.description || product.description,
      headline: product.translations?.find(t => t.languages_code === lang)?.headline || '',
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function Header({ lang }: { lang: string }) {
  const navigationItems = await getNavigationItems(lang);
  const products = await getProducts(lang);
  const globals = await getGlobalsByLang(lang);

  return (
    <header className="border-b border-border bg-background py-2 text-foreground md:py-4">
      <div className="flex items-center justify-between px-4 md:container">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link
            href={`/${lang}`}
            className="text-xl font-bold text-foreground md:text-2xl"
          >
            {globals?.tagline || 'error'}
          </Link>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="md:hidden"
              aria-label="Open menu"
            >
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
            <nav className="flex flex-col gap-4">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  {item.children ? (
                    <Accordion type="single" collapsible>
                      <AccordionItem value={item.id}>
                        <AccordionTrigger>{item.label}</AccordionTrigger>
                        <AccordionContent>
                          <div className="flex flex-col gap-2">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.url}
                                className="rounded-md px-4 py-2 hover:bg-accent"
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
                      className="block rounded-md px-4 py-2 hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              {/* Products Section */}
              <Accordion type="single" collapsible>
                <AccordionItem value="products">
                  <AccordionTrigger>Products</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2">
                      {products.map((product) => (
                        <Link
                          key={product.id}
                          href={product.url}
                          className="rounded-md px-4 py-2 hover:bg-accent"
                        >
                          {product.label}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <LanguageSwitcher isMobile={true} />  
              </Accordion>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                {item.children ? (
                  <>
                    <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[min(400px,90vw)] gap-3 p-4 md:w-[min(500px,90vw)] md:grid-cols-2 lg:w-[min(600px,90vw)]">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={child.url}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
                  <Link
                    href={item.url}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                <ProductMenu products={products} />
            </NavigationMenuItem>
          </NavigationMenuList>
          <LanguageSwitcher />
        </NavigationMenu>
      </div>
    </header>
  );
}
