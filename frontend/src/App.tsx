import '@fontsource-variable/space-grotesk';
import '@mantine/core/styles.css';

import { MantineProvider, createTheme } from '@mantine/core';
import { Layout } from './components/Layout';

const theme = createTheme({
  fontFamily: "'Space Grotesk Variable', sans-serif",
  headings: {
    fontFamily: "'Space Grotesk Variable', sans-serif",
    fontWeight: "500"
  },
})

export const App = () => {
  return <MantineProvider theme={theme}>
    <Layout>

    </Layout>
  </MantineProvider>;
}