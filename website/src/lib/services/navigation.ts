import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export type NavigationItem = {
  id: string;
  url: string;
  label: string;
  phosphor_icon?: string;
  children?: NavigationItem[];
};

export type Product = {
  id: string;
  url: string;
  slug: string;
  name: string;
  cover?: string;
  label: string;
  description?: string;
  headline?: string;
  type?: string;
  translations: Array<{
    languages_code: string;
    name: string;
    description?: string;
    headline?: string;
  }>;
};

export async function getNavigationItems(
  lang: string,
): Promise<NavigationItem[]> {
  try {
    const response = await client.request<any[]>(
      readItems('navigation', {
        filter: {
          id: { _eq: 'main' },
        },
        fields: [
          '*',
          'translations.*',
          'items.*',
          'items.navigation_items_id.*',
          'items.navigation_items_id.translations.*',
          'items.navigation_items_id.children.*',
          'items.navigation_items_id.children.translations.*',
        ],
      }),
    );

    if (response && response.length > 0) {
      const navigation = response[0];

      const mappedItems = navigation.items.map((item: any) => ({
        id: item.navigation_items_id.id,
        url: item.navigation_items_id.url || '',
        label:
          item.navigation_items_id.translations?.find(
            (t: any) => t.languages_code === lang,
          )?.label || '',
        phosphor_icon: item.navigation_items_id.phosphor_icon || undefined,
        children:
          item.navigation_items_id.children?.map((child: any) => ({
            id: child.id,
            url: child.url || '',
            label:
              child.translations?.find((t: any) => t.languages_code === lang)
                ?.label || '',
            phosphor_icon: child.phosphor_icon || undefined,
          })) || undefined,
      }));

      return mappedItems;
    }
    return [];
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }
}

export async function getProducts(lang: string): Promise<Product[]> {
  try {
    const products = await client.request(
      readItems('products', {
        fields: [
          'id',
          'slug',
          'name',
          'cover',
          'description',
          'translations.*',
        ],
      }),
    );

    return products.map((product: any) => ({
      id: product.id,
      url: `/products/${product.slug}`,
      cover: product.cover,
      label:
        product.translations?.find((t) => t.languages_code === lang)?.name ||
        product.name,
      description:
        product.translations?.find((t) => t.languages_code === lang)
          ?.description || product.description,
      headline:
        product.translations?.find((t) => t.languages_code === lang)
          ?.headline || '',
      type:
        product.translations?.find((t) => t.languages_code === lang)?.type ||
        '',
      ...product,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
