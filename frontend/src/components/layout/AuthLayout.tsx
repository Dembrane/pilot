import { Divider, LoadingOverlay } from "@mantine/core";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { PropsWithChildren, useEffect } from "react";
import { Toaster } from "../common/Toaster";
import { useAuthenticated } from "@/lib/useAuthenticated";
import { usei18nNavigate } from "@/lib/usei18nNavigate";

export const AuthLayout = (props: PropsWithChildren) => {
  const [query] = useSearchParams();
  const navigate = usei18nNavigate();

  const auth = useAuthenticated();

  useEffect(() => {
    if (auth.isAuthenticated) {
      const nextLink = query.get("next") ?? "/projects";
      navigate(nextLink);
    }
  }, [auth.isAuthenticated]);

  return (
    <div className="flex min-h-dvh flex-col">
      <LoadingOverlay visible={auth.loading} />
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
