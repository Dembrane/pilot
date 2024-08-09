import { cn } from "@/lib/utils";
import { Paper } from "@mantine/core";
import React from "react";

type Props = {
  children?: React.ReactNode;
  fromUser?: boolean;
};

export const ChatMessage = ({ children, fromUser }: Props) => {
  return (
    <div className={cn("flex", fromUser ? "justify-end" : "justify-start")}>
      <Paper
        className={cn(
          "max-w-full rounded-t-xl border border-slate-200 p-4 shadow-sm md:max-w-[80%]",
          fromUser
            ? "rounded-bl-xl rounded-br-none !bg-primary-100"
            : "rounded-bl-none rounded-br-xl",
        )}
      >
        {children}
      </Paper>
    </div>
  );
};
