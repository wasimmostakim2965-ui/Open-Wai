import type { HubFilesState, HubSearchState, HubSpecsState } from "./model-hub-page.ts";

/** Test-facing surface of the page element (private state is read through it). */
export type ModelHubPageTestElement = HTMLElement & {
  updateComplete: Promise<boolean>;
  query: string;
  search: HubSearchState;
  selectedRepo: string | null;
  files: HubFilesState;
  specs: HubSpecsState;
  runSearch: () => Promise<void>;
  selectRepo: (repo: string) => Promise<void>;
};
