import { authentication, createDirectus, rest } from '@directus/sdk';
import { CustomDirectusTypes } from '../types';

const DIRECTUS_PUBLIC_URL = 'https://admin-dembrane.azurewebsites.net';

export const client = createDirectus<CustomDirectusTypes>(DIRECTUS_PUBLIC_URL)
  .with(
    authentication('session', { credentials: 'include', autoRefresh: true }),
  )
  .with(
    rest({
      credentials: 'include',
    }),
  );
