import { Stack, Divider } from "@mantine/core";
import { Footer } from "../common/Footer";
import { Header } from "../common/Header";
import { Outlet } from "react-router-dom";
import { PropsWithChildren } from "react";
import { Toaster } from "../Toaster";

export const AuthLayout = (props: PropsWithChildren) => {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-grow">
        <Outlet />
        {props.children}
      </main>
      <Divider />
      <div className="p-2">
        <Footer />
      </div>
      <Toaster />
    </div>
  );
};
