import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Dembrane Docs: Echo</span>,
  docsRepositoryBase: "https://github.com/Dembrane/pilot/tree/main/docs",
  banner: {
    key: 'in-progress',
    text: "🚧 Dembrane Docs is under construction - Things will change"
  },
  footer: {
    text: "Dembrane Docs",
  },
  i18n: [
    { locale: "en-US", text: "English" },
    { locale: "nl-NL", text: "Nederlands" },
  ],
}

export default config
