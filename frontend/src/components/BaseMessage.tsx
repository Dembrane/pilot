import { Icons } from "@/icons";
import { t } from "@lingui/macro";
import { PaperProps, Text, Paper, Group, Box } from "@mantine/core";
import { PropsWithChildren } from "react";

export const BaseMessage = (
  props: PropsWithChildren<{
    text?: string;
    title?: string;
    rightSection?: React.ReactNode;
    paperProps?: PaperProps;
  }>,
) => {
  return (
    <Paper
      pos="relative"
      bg="gray.1"
      p="sm"
      className="!bg-opacity-50"
      {...props.paperProps}
    >
      <Group align="start" wrap="nowrap">
        <div className="pt-1">
          <Icons.Diamond color="black" />
        </div>
        <Box flex={1}>
          <Group align="baseline" justify="space-between">
            <Text mb="xs" size="sm">
              {props.title ?? t`You`}
            </Text>
            {props.rightSection}
          </Group>
          <div>
            {props.text && <Text size="sm">{props.text}</Text>}
            {props.children}
          </div>
        </Box>
      </Group>
    </Paper>
  );
};
