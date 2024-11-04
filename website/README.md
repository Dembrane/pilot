# Dembrane Website

[Dembrane](https://dembrane.com)

## IMPORTANT:

When adding a new page make sure to use `initLingui` in the page component.

Example:
```tsx
async function HomePage({ params }: PageProps) {
  // don't forget to "await" the params
  const { lang } = (await params);

  // use initLingui to initialize lingui
  initLingui(lang as 'en-US' | 'nl-NL');

  return <div>Home</div>;
}

// no need to wrap in withLinguiPage
export default HomePage;
```

## Todos

[ ] Integrate Directus
[ ] Add routes
[ ] Deploy to Vercel

## Running Locally

0. Install pnpm

```sh
npm install -g pnpm
```

1. Install dependencies:

```sh
pnpm install
```

2. Start the dev server:

```sh
pnpm dev
```

## Documentation

https://nextjs.org/docs
