import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { I18nProvider } from "./components/I18nProvider";
import { primaryRouter } from "./Router";
import { IconChevronRight } from "@tabler/icons-react";

const theme = createTheme({
  fontFamily: "'Space Grotesk Variable', sans-serif",
  headings: {
    fontFamily: "'Space Grotesk Variable', sans-serif",
    fontWeight: "500",
  },
  colors: {
    primary: [
      "#e2f6ff",
      "#cbe9ff",
      "#99cfff",
      "#62b5ff",
      "#369eff",
      "#1890ff",
      "#0089ff",
      "#0076e5",
      "#0069ce",
      "#005ab7",
    ],
    // generateColors("#1A408E"),
  },
  primaryColor: "primary",
  components: {
    Breadcrumbs: {
      defaultProps: {
        separator: <IconChevronRight />,
      },
    },
    Container: {
      defaultProps: {
        py: "lg",
      },
    },
    Paper: {
      defaultProps: {
        rounded: "md",
        shadow: "md",
        bg: "gray.0",
      },
    },
    Button: {
      defaultProps: {
        color: "primary",
        variant: "filled",
      },
    },
  },
});

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <I18nProvider>
          <RouterProvider router={primaryRouter} />
        </I18nProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};
