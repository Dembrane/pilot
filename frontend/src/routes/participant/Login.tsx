import { Logo } from "@/components/Logo";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Divider,
  Group,
  Text,
  InputLabel,
  PinInput,
  Stack,
  TextInput,
  LoadingOverlay,
  MultiSelect,
  Modal,
  Title,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useInitiateConversationMutation, useProjectTags } from "@/lib/query";
import { AxiosError } from "axios";
import { Trans, t } from "@lingui/macro";
import { useLanguage } from "@/lib/useLanguage";
import { useDisclosure } from "@mantine/hooks";
import { Markdown } from "@/components/Markdown";
import { PRIVACY_POLICY_URL } from "@/config";

const FormSchema = z.object({
  // email: z.string().email("Must be a valid email address.").optional(),
  name: z.string(),
  pin: z.string().min(4),
  tagIdList: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof FormSchema>;

export const ParticipantLoginRoute = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tagsQuery = useProjectTags(projectId as string);

  const [opened, { open, close }] = useDisclosure(true);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const { isSuccess, isError, ...initiateConversationMutation } =
    useInitiateConversationMutation();

  const onSubmit = (data: FormValues) => {
    initiateConversationMutation.mutate({
      projectId: projectId as string,
      // email: data.email,
      name: data.name,
      pin: data.pin,
      tagIdList: data.tagIdList,
    });
  };

  const { language } = useLanguage();

  useEffect(() => {
    if (searchParams.get("pin")) {
      setValue("pin", searchParams.get("pin") ?? "");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSuccess) {
      if (initiateConversationMutation.data?.id) {
        navigate(
          `/${language}/${projectId}/conversation/${initiateConversationMutation.data?.id}`,
        );
      } else {
        reset();
      }
    }
  }, [isSuccess, reset, initiateConversationMutation.data?.id, navigate]);

  useEffect(() => {
    if (isError) {
      reset();
    }
  }, []);

  return (
    <>
      <Modal
        withCloseButton={false}
        opened={opened}
        onClose={close}
        bg="white"
        fullScreen
        radius={0}
      >
        <Stack className="h-full" p="md">
          <Stack className="flex-grow" p="md" justify="center">
            <Group justify="center" className="pb-8">
              <Logo hideTitle h="64px" />
            </Group>
            <Stack mx="auto">
              <Title order={1}>
                <Trans>Hi! Welcome to Dembrane.</Trans>
              </Title>
              <Markdown
                content={
                  t`This is a super simple tool for you to record a story or a conversation and share it with the host.
We will first ask you some quick questions, then you can get started with recording.
<br/><br/>
*At Dembrane, privacy is really important. We make sure nothing is traceable to individuals, and even if you might accidentally say someone’s name, we delete this before we analyse the data. By using this tool, you agree to our privacy policy. Do you want to know more? Feel free to read our [privacy statement]` +
                  `(${PRIVACY_POLICY_URL}).*` +
                  "<br/><br/>" +
                  t`We don't have a cookie banner because we don't use cookies! We just eat them.` +
                  `🍪`
                }
              />
              <Button onClick={close} size="xl">
                <Trans>Ready!</Trans>
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Modal>

      <Stack className="h-full" p="md">
        <Stack className="flex-grow" p="md" justify="center">
          <Group justify="center" className="pb-8">
            <Logo hideTitle h="64px" />
          </Group>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack className="relative">
              {initiateConversationMutation.error && (
                <Box>
                  <Alert color="red" variant="light">
                    {(initiateConversationMutation.error instanceof
                      AxiosError &&
                      initiateConversationMutation.error.response?.data
                        .detail) ??
                      t`Something went wrong`}
                  </Alert>
                </Box>
              )}

              <TextInput
                autoFocus
                required
                size="lg"
                label={t`Name`}
                placeholder="John Doe, Group 1, etc."
                {...register("name")}
                error={errors.name?.message}
              />
              {!searchParams.get("pin") && (
                <Box>
                  <InputLabel size="lg">
                    <Trans>Enter your access code</Trans>
                  </InputLabel>
                  <PinInput
                    {...register("pin")}
                    error={!!errors.pin?.message}
                    size="lg"
                    inputMode="numeric"
                    length={4}
                    onChange={(value: string) => {
                      setValue("pin", value);
                    }}
                  />
                </Box>
              )}
              <Box className="relative">
                {tagsQuery.isLoading && <LoadingOverlay />}
                {tagsQuery.data && (
                  <MultiSelect
                    label={t`Group`}
                    placeholder={t`Select your group`}
                    size="lg"
                    data={tagsQuery.data.map((tag) => ({
                      value: tag.id,
                      label: tag.text,
                    }))}
                    onChange={(value) => {
                      setValue("tagIdList", value);
                    }}
                  />
                )}
              </Box>
              <Button
                type="submit"
                size="lg"
                loading={initiateConversationMutation.isPending}
              >
                <Trans>Next</Trans>
              </Button>
            </Stack>
          </form>
        </Stack>
        <Stack>
          <Divider />
          <Stack gap="xs" justify="center" align="center">
            <Anchor size="sm" target="_blank" href={PRIVACY_POLICY_URL}>
              <Trans>Privacy Statements</Trans>
            </Anchor>
            <Text size="sm">Dembrane B.V. 2024, all rights reserved.</Text>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};
