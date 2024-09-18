import { createTheme } from "@mantine/core";
import { IconChevronRight, IconInfoCircle } from "@tabler/icons-react";
import accordionClasses from "./styles/accordion.module.css";

export const theme = createTheme({
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
    dark: [
      "#f9fafb",
      "#f3f4f6",
      "#e5e7eb",
      "#d1d5db",
      "#9ca3af",
      "#6b7280",
      "#4b5563",
      "#1f2937",
      "#111827",
      "#030712",
    ],
  },
  primaryColor: "primary",
  components: {
    ActionIcon: {
      defaultProps: {
        size: 36,
      },
    },
    Tooltip: {
      defaultProps: {
        withArrow: true,
      },
    },
    Title: {
      defaultProps: {
        color: {
          dark: "white",
          light: "black",
        },
      },
    },
    Alert: {
      defaultProps: {
        variant: "light",
        icon: <IconInfoCircle />,
      },
    },
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
        bg: { dark: "dark.8", light: "white" },
        border: { dark: "dark.8", light: "gray.1" },
        withBorder: true,
      },
    },
    Menu: {
      defaultProps: {
        shadow: "md",
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
    SimpleGrid: {
      defaultProps: {
        spacing: "sm",
      },
    },
    Accordion: {
      defaultProps: {
        variant: "filled",
        chevronPosition: "left",
        chevron: <IconChevronRight />,
        classNames: {
          // to provide right rotation and reduce padding
          chevron: accordionClasses.chevron,
        },
        styles: {
          control: {
            backgroundColor: "transparent",
            padding: 0,
          },
          content: {
            padding: 0,
          },
          item: {
            backgroundColor: "transparent",
            padding: 0,
          },
          panel: {
            backgroundColor: "transparent",
            paddingLeft: "24px",
          },
        },
      },
    },
  },
});
