import { definePage } from "@openclaw/uirouter";
import { html } from "lit";
import { routePageSpec } from "../../app-route-paths.ts";

export const page = definePage({
  ...routePageSpec("model-hub"),
  component: () =>
    import("./model-hub-page.ts").then(() => ({
      header: true,
      render: () => html`<openclaw-model-hub-page></openclaw-model-hub-page>`,
    })),
});
