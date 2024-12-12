import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Icons } from "@/icons";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Accordion, Group, Text, Title, Tooltip } from "@mantine/core";
import { UploadResourceDropzone } from "../dropzone/UploadResourceDropzone";

// Resource Accordion
const ResourceAccordion = ({ projectId }: { projectId: string }) => {
  const resources = [];
  const [parent] = useAutoAnimate();

  return (
    <Accordion.Item value="resources">
      <Accordion.Control>
        <Group justify="space-between">
          <Title order={3}>
            <span className="min-w-[48px] pr-2 font-normal text-gray-500">
              {resources.length}
            </span>
            <Trans>Resources</Trans>
          </Title>
          <Tooltip label={t`Upload resources`}>
            <div>
              <UploadResourceDropzone projectId={projectId}>
                <Icons.Plus stroke="black" fill="black" />
              </UploadResourceDropzone>
            </div>
          </Tooltip>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Accordion variant="separated" radius="md">
          <div ref={parent} className="relative">
            {resources?.length === 0 && (
              <Text size="sm">
                <Trans>No resources found.</Trans>
              </Text>
            )}
          </div>
        </Accordion>
      </Accordion.Panel>
    </Accordion.Item>
  );
};
