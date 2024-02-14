import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import Layout from './components/Layout';

export const App = () => {
  return <MantineProvider>
    <Layout>
    <div>
        Hello world!
    </div>

    </Layout>
  </MantineProvider>;
}