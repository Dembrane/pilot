import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Layout } from "./components/Layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const theme = createTheme({
  fontFamily: "'Space Grotesk Variable', sans-serif",
  headings: {
    fontFamily: "'Space Grotesk Variable', sans-serif",
    fontWeight: "500",
  },
});

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Layout />
      </MantineProvider>
    </QueryClientProvider>
  );
};
