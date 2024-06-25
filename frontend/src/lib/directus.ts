import { DIRECTUS_PUBLIC_URL } from "@/config";
import { createDirectus, rest, realtime } from "@directus/sdk";

export const directus =
  createDirectus<CustomDirectusTypes>(DIRECTUS_PUBLIC_URL).with(rest());

// remove any http or https from the url
const directusBaseUrl = ((DIRECTUS_PUBLIC_URL as string) ?? "").replace(
  /^(https?:\/\/)/,
  "",
);

export const wsDirectus = createDirectus<CustomDirectusTypes>(
  "ws://" + directusBaseUrl + "/websocket",
).with(realtime());

wsDirectus.connect().then(() => {
  console.log("Connected to realtime");
});
