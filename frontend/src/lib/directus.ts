import { DIRECTUS_PUBLIC_URL } from "@/config";
import { createDirectus, rest, graphql, realtime } from "@directus/sdk";

export const directus = createDirectus<CustomDirectusTypes>(
  "http://localhost:8055",
).with(rest());

export const wsDirectus = createDirectus<CustomDirectusTypes>(
  "ws://localhost:8055/websocket",
).with(realtime());

wsDirectus.connect().then(() => {
  console.log("Connected to realtime");
});
