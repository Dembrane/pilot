import { Divider, LoadingOverlay } from "@mantine/core";
import { Footer } from "../common/Footer";
import { Header } from "../common/Header";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { PropsWithChildren, useEffect } from "react";
import { Toaster } from "../common/Toaster";
import { useAuthenticated } from "@/lib/useAuthenticated";

export const AuthLayout = (props: PropsWithChildren) => {
  const [query] = useSearchParams();
  const navigate = useNavigate();

  const auth = useAuthenticated();

  useEffect(() => {
    if (auth.isAuthenticated) {
      const nextLink = query.get("next") ?? "/projects";
      navigate(nextLink);
    }
  }, [auth.isAuthenticated]);

  return (
    <div className="flex flex-col min-h-dvh">
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
