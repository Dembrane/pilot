import { cn } from "@/lib/utils";
import {
  Group,
  Paper,
  PolymorphicComponentProps,
  Text,
  UnstyledButton,
  UnstyledButtonProps,
} from "@mantine/core";
import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { I18nLink } from "@/components/common/i18nLink";

type Props = {
  to?: string;
  rightIcon?: React.ReactNode;
  rightSection?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
} & PolymorphicComponentProps<"a" | "button", UnstyledButtonProps>;

export const NavigationButton = ({
  children,
  to,
  rightSection, // not clickable
  rightIcon, // clickable
  active,
  disabled = false,
  ...props
}: PropsWithChildren<Props>) => {
  return (
    <Paper
      className={cn(
        "w-full border border-gray-200 bg-white transition-colors hover:border-primary-500",
        active ? "border-primary-500" : "",
        props.className,
      )}
    >
      <Group align="center" wrap="nowrap">
        {to ? (
          <I18nLink to={to} className="flex-grow px-4 py-2">
            <UnstyledButton
              {...props}
              className={cn(
                "w-full text-left",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <Group className="w-full justify-between">
                <Text size="lg" className="font-semibold">
                  {children}
                </Text>
                {!!rightIcon && rightIcon}
              </Group>
            </UnstyledButton>
          </I18nLink>
        ) : (
          <UnstyledButton
            {...props}
            disabled={disabled}
            className={cn(
              "h-full w-full px-4 py-2 text-left",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
            )}
          >
            <Group className="h-full w-full justify-between">
              <Text size="lg" className="font-semibold">
                {children}
              </Text>
              {!!rightIcon && rightIcon}
            </Group>
          </UnstyledButton>
        )}

        {!!rightSection && (
          <div
            onClick={(e) => {
              e.stopPropagation(); // Prevent the main link from being activated
            }}
            className="mx-2 h-full"
          >
            {rightSection}
          </div>
        )}
      </Group>
    </Paper>
  );
};
