import React, { useState, useEffect } from "react";
import { Box, Text, Group, useMantineTheme } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";

const BreakpointIndicator: React.FC = () => {
  const { width } = useViewportSize();
  const [currentBreakpoint, setCurrentBreakpoint] = useState("");
  const theme = useMantineTheme();

  const breakpoints = {
    xs: parseInt(theme.breakpoints.xs),
    sm: parseInt(theme.breakpoints.sm),
    md: parseInt(theme.breakpoints.md),
    lg: parseInt(theme.breakpoints.lg),
    xl: parseInt(theme.breakpoints.xl),
    "2xl": parseInt(theme.breakpoints["2xl"]),
  };

  useEffect(() => {
    const getBreakpoint = () => {
      if (width < breakpoints.xs) return "base";
      if (width < breakpoints.sm) return "xs";
      if (width < breakpoints.md) return "sm";
      if (width < breakpoints.lg) return "md";
      if (width < breakpoints.xl) return "lg";
      if (width < breakpoints["2xl"]) return "xl";
      return "2xl";
    };
    setCurrentBreakpoint(getBreakpoint());
  }, [width]);

  const getNextBreakpoint = () => {
    const breakpointOrder = ["base", "xs", "sm", "md", "lg", "xl", "2xl"];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    return currentIndex < breakpointOrder.length - 1
      ? breakpointOrder[currentIndex + 1]
      : "None";
  };

  const getPrevBreakpoint = () => {
    const breakpointOrder = ["base", "xs", "sm", "md", "lg", "xl", "2xl"];
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    return currentIndex > 0 ? breakpointOrder[currentIndex - 1] : "None";
  };

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "8px",
        fontSize: "14px",
      }}
    >
      <Group justify="center">
        <Text>
          {/* @ts-ignore */}
          Previous: {getPrevBreakpoint()} ({breakpoints[getPrevBreakpoint()]})
        </Text>
        <Text>
          Current: {currentBreakpoint} ({width})
        </Text>
        <Text>
          {/* @ts-ignore */}
          Next: {getNextBreakpoint()} ({breakpoints[getNextBreakpoint()]})
        </Text>
      </Group>
    </Box>
  );
};

export default BreakpointIndicator;
