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
    // generateColors("#1A408E"),
  },
  primaryColor: "primary",
  components: {
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
