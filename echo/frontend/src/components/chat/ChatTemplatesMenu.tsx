import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Button, Menu, SimpleGrid, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCalculator, IconNotes } from "@tabler/icons-react";
import { CloseableAlert } from "@/components/common/ClosableAlert";

// all this function does is that if someone clicks on a template, it will set the input to the template content
// we need input to check if there is something in the chat box already
export const ChatTemplatesMenu = ({
  input,
  setInput,
}: {
  input: string;
  setInput: (input: string) => void;
}) => {
  const templates = [
    {
      title: t`Summarize`,
      icon: IconNotes,
      content: t`Please provide a concise summary of the following provided in the context.`,
    },
    {
      title: t`Compare & Contrast`,
      icon: IconCalculator,
      content: t`Compare and contrast the following items provided in the context.`,
    },
    {
      title: t`Meeting Notes`,
      icon: IconNotes,
      content: t`Generate structured meeting notes based on the following discussion points provided in the context.`,
    },
  ];

  const handleTemplateClick = (content: string) => {
    if (
      input.trim() !== "" &&
      !window.confirm(t`This will clear your current input. Are you sure?`)
    ) {
      return;
    }
    setInput(content);
  };

  const [open, setOpen] = useDisclosure(false);

  return (
    <Menu
      position="top"
      withArrow
      opened={open}
      onOpen={setOpen.open}
      onClose={setOpen.close}
    >
      <Menu.Target>
        <Button variant="subtle" color="gray">
          <Trans>Templates</Trans>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Stack p="md" gap="sm">
          <CloseableAlert variant="info" title={t`Templates`}>
            <Trans>
              These are some helpful preset templates to get you started.
            </Trans>
          </CloseableAlert>
          <SimpleGrid cols={2}>
            {templates.map((template) => (
              <Button
                key={template.title}
                variant="outline"
                color="gray"
                onClick={() => {
                  handleTemplateClick(template.content);
                  setOpen.close();
                }}
                leftSection={<template.icon />}
              >
                <Text size="sm">{template.title}</Text>
              </Button>
            ))}
          </SimpleGrid>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
};
