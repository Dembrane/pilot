import "@fontsource-variable/space-grotesk";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { I18nProvider } from "./components/I18nProvider";
import { mainRouter, participantRouter } from "./Router";
import { IconChevronRight } from "@tabler/icons-react";
import { USE_PARTICIPANT_ROUTER } from "./config";

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
        // rounded: "xl",
        bg: "gray.0",
        // withBorder: true,
        classNames: {
          root: "rounded-md border border-gray-100",
        },
      },
    },
    Button: {
      defaultProps: {
        color: "primary",
        variant: "filled",
      },
    },
    Textarea: {
      defaultProps: {
        resize: "vertical",
      },
    },
    Pill: {
      defaultProps: {
        bg: "primary.1",
        color: "primary.8",
      },
    },
  },
});

const queryClient = new QueryClient();

const router = USE_PARTICIPANT_ROUTER ? participantRouter : mainRouter;

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};
