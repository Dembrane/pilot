/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en-US', 'nl-NL'],
  sourceLocale: 'en-US',
  fallbackLocales: {
    default: 'nl-NL',
  },
  catalogs: [
    {
      path: 'src/locales/{locale}',
      include: ['src/'],
    },
  ],
};
// command is npx lingui extract     , npm run compile                                                                         