import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { generateColors } from "@mantine/colors-generator";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Router";

const theme = createTheme({
  fontFamily: "'Space Grotesk Variable', sans-serif",
  headings: {
    fontFamily: "'Space Grotesk Variable', sans-serif",
    fontWeight: "500",
  },
  colors: {
    primary: generateColors("#1A408E"),
  },
});

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
};
