module.exports = {
  locales: ['en-US', 'nl-NL'],
  sourceLocale: 'en-US',
  catalogs: [
    {
      path: 'src/locales/{locale}',
      include: ['src'],
    },
  ],
  format: 'po',
};
