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

  const { language, i18n } = useLanguage();

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
                <Trans>Hi, Thanks for sharing!</Trans>
              </Title>
              <Markdown
                content={
                  t`This is a very simple tool where you can record conversations or stories to make your voice heard.` +
                  `<br/><br/>` +
                  t`First we ask some short questions, and then you can start recording.` +
                  "<br/><br/>" +
                  t`You can use this by yourself to share your own story, or you can record a conversation between several people, which can often be fun and insightful!` +
                  "<br/><br/>" +
                  t`Are you ready? Then press "Ready!"`
                }
              />
              <Button onClick={close} size="xl">
                <Trans>Ready!</Trans>
              </Button>
              <Markdown
                content={
                  t`*At Dembrane, privacy is super important!*` +
                  "<br/><br/>" +
                  t`*We make sure nothing can be traced back to you, and even if you accidentally say your name, we remove it before analysing everything. By using this tool, you agree to our privacy terms. Want to know more? Then read our [privacy statement]` +
                  `(${PRIVACY_POLICY_URL}).*` +
                  "<br/><br/>" +
                  t`*Oh, we don't have a cookie statement because we don't use cookies! We eat them.*` +
                  ` 🍪`
                }
              />
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
                {tagsQuery.data && tagsQuery.data.length > 0 && (
                  <MultiSelect
                    label={t`Tags`}
                    placeholder={t`Add all that apply`}
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
