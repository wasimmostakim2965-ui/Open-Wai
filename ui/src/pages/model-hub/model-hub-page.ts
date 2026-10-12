// Hugging Face model hub browser page.
import { consume } from "@lit/context";
import { html, nothing, type TemplateResult } from "lit";
import { state } from "lit/decorators.js";
import type {
  ModelsHubDownloadResult,
  ModelsHubFile,
  ModelsHubRepoSummary,
  ModelsHubSpecsResult,
} from "../../api/types.ts";
import { titleForRoute } from "../../app-navigation.ts";
import { applicationContext, type ApplicationContext } from "../../app/context.ts";
import { icons } from "../../components/icons.ts";
import {
  renderSettingsPage,
  renderSettingsPageHeader,
  renderSettingsSection,
} from "../../components/settings-ui.ts";
import { t } from "../../i18n/index.ts";
import { formatBytes } from "../../lib/agents/display.ts";
import { OpenClawLightDomElement } from "../../lit/openclaw-element.ts";
import { SubscriptionsController } from "../../lit/subscriptions-controller.ts";
import "../../styles/model-hub.css";

const SEARCH_DEBOUNCE_MS = 350;

export type HubSearchState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; repos: ModelsHubRepoSummary[]; hasMore: boolean };

export type HubFilesState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; repo: string; files: ModelsHubFile[] };

export type HubSpecsState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; specs: ModelsHubSpecsResult };

export type HubDownloadState =
  | { phase: "idle" }
  | { phase: "downloading"; file: string }
  | { phase: "error"; file: string; message: string }
  | { phase: "done"; file: string; result: ModelsHubDownloadResult };

class ModelHubPage extends OpenClawLightDomElement {
  @consume({ context: applicationContext, subscribe: true })
  private context!: ApplicationContext;

  @state() private query = "";
  @state() private search: HubSearchState = { phase: "idle" };
  @state() private selectedRepo: string | null = null;
  @state() private files: HubFilesState = { phase: "idle" };
  @state() private specs: HubSpecsState = { phase: "idle" };
  @state() private download: HubDownloadState = { phase: "idle" };

  private debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private searchEpoch = 0;
  private detailEpoch = 0;
  private readonly subscriptions = new SubscriptionsController(this).watchStore(
    () => this.context?.gateway,
  );

  override disconnectedCallback() {
    this.subscriptions.clear();
    globalThis.clearTimeout(this.debounceTimer ?? undefined);
    this.debounceTimer = null;
    this.searchEpoch += 1;
    this.detailEpoch += 1;
    super.disconnectedCallback();
  }

  private get client() {
    return this.context?.gateway.snapshot.client ?? null;
  }

  private errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  private onQueryInput(value: string) {
    this.query = value;
    globalThis.clearTimeout(this.debounceTimer ?? undefined);
    this.debounceTimer = globalThis.setTimeout(() => void this.runSearch(), SEARCH_DEBOUNCE_MS);
  }

  private async runSearch() {
    const client = this.client;
    const epoch = (this.searchEpoch += 1);
    if (!client) {
      this.search = { phase: "error", message: t("modelHub.gatewayOffline") };
      return;
    }
    this.search = { phase: "loading" };
    try {
      const result = await client.request<{
        repos: ModelsHubRepoSummary[];
        hasMore: boolean;
      }>("models.hub.search", { query: this.query.trim() || undefined, limit: 20 });
      if (epoch !== this.searchEpoch || !this.isConnected) {
        return;
      }
      this.search = { phase: "ready", repos: result.repos, hasMore: result.hasMore };
    } catch (err) {
      if (epoch !== this.searchEpoch || !this.isConnected) {
        return;
      }
      this.search = { phase: "error", message: this.errorMessage(err) };
    }
  }

  private async selectRepo(repo: string) {
    this.selectedRepo = repo;
    this.download = { phase: "idle" };
    const client = this.client;
    const epoch = (this.detailEpoch += 1);
    this.files = { phase: "loading" };
    this.specs = { phase: "loading" };
    if (!client) {
      this.files = { phase: "error", message: t("modelHub.gatewayOffline") };
      this.specs = { phase: "idle" };
      return;
    }
    const [filesResult, specsResult] = await Promise.allSettled([
      client.request<{ repo: string; revision: string; files: ModelsHubFile[] }>(
        "models.hub.files",
        { repo },
      ),
      client.request<ModelsHubSpecsResult>("models.hub.specs", { repo }),
    ]);
    if (epoch !== this.detailEpoch || !this.isConnected || this.selectedRepo !== repo) {
      return;
    }
    this.files =
      filesResult.status === "fulfilled"
        ? { phase: "ready", repo, files: filesResult.value.files }
        : { phase: "error", message: this.errorMessage(filesResult.reason) };
    this.specs =
      specsResult.status === "fulfilled"
        ? { phase: "ready", specs: specsResult.value }
        : { phase: "error", message: this.errorMessage(specsResult.reason) };
  }

  private async downloadFile(file: string) {
    const client = this.client;
    const repo = this.selectedRepo;
    if (!client || !repo) {
      this.download = { phase: "error", file, message: t("modelHub.gatewayOffline") };
      return;
    }
    this.download = { phase: "downloading", file };
    try {
      const result = await client.request<ModelsHubDownloadResult>("models.hub.download", {
        repo,
        file,
      });
      if (!this.isConnected) {
        return;
      }
      this.download = { phase: "done", file, result };
    } catch (err) {
      if (!this.isConnected) {
        return;
      }
      this.download = { phase: "error", file, message: this.errorMessage(err) };
    }
  }

  private renderRepoList(): TemplateResult {
    const state = this.search;
    if (state.phase === "idle") {
      return html`<p class="model-hub__hint">${t("modelHub.searchHint")}</p>`;
    }
    if (state.phase === "loading") {
      return html`<p class="model-hub__hint">${icons.loader} ${t("modelHub.searching")}</p>`;
    }
    if (state.phase === "error") {
      return html`<p class="model-hub__error" role="alert">${state.message}</p>`;
    }
    if (state.repos.length === 0) {
      return html`<p class="model-hub__hint">${t("modelHub.noResults")}</p>`;
    }
    return html`
      <ul class="model-hub__list">
        ${state.repos.map(
          (repo) => html`
            <li>
              <button
                type="button"
                class="model-hub__repo ${
                  repo.id === this.selectedRepo ? "model-hub__repo--selected" : ""
                }"
                @click=${() => void this.selectRepo(repo.id)}
              >
                <span class="model-hub__repo-id">${repo.id}</span>
                <span class="model-hub__repo-meta">
                  ${
                    repo.downloads !== undefined
                      ? html`<span>${icons.download} ${repo.downloads.toLocaleString()}</span>`
                      : nothing
                  }
                  ${
                    repo.likes !== undefined
                      ? html`<span>${icons.star} ${repo.likes.toLocaleString()}</span>`
                      : nothing
                  }
                  ${repo.gated ? html`<span class="model-hub__badge">${t("modelHub.gated")}</span>` : nothing}
                </span>
              </button>
            </li>
          `,
        )}
      </ul>
      ${state.hasMore ? html`<p class="model-hub__hint">${t("modelHub.moreResults")}</p>` : nothing}
    `;
  }

  private renderSpecs(): TemplateResult {
    const state = this.specs;
    if (state.phase === "idle") {
      return html``;
    }
    if (state.phase === "loading") {
      return html`<p class="model-hub__hint">${icons.loader} ${t("modelHub.loadingSpecs")}</p>`;
    }
    if (state.phase === "error") {
      return html`<p class="model-hub__error" role="alert">${state.message}</p>`;
    }
    const { architecture, contextLength, parameterCount, quantizations } = state.specs;
    return html`
      <dl class="model-hub__specs">
        ${
          architecture
            ? html`<dt>${t("modelHub.architecture")}</dt>
                <dd>${architecture}</dd>`
            : nothing
        }
        ${
          contextLength !== undefined
            ? html`<dt>${t("modelHub.contextLength")}</dt>
                <dd>${contextLength.toLocaleString()}</dd>`
            : nothing
        }
        ${
          parameterCount !== undefined
            ? html`<dt>${t("modelHub.parameters")}</dt>
                <dd>${parameterCount.toLocaleString()}</dd>`
            : nothing
        }
        ${
          quantizations.length > 0
            ? html`<dt>${t("modelHub.quantizations")}</dt>
                <dd>${quantizations.join(", ")}</dd>`
            : nothing
        }
      </dl>
    `;
  }

  private renderFiles(): TemplateResult {
    const state = this.files;
    if (state.phase === "idle") {
      return html``;
    }
    if (state.phase === "loading") {
      return html`<p class="model-hub__hint">${icons.loader} ${t("modelHub.loadingFiles")}</p>`;
    }
    if (state.phase === "error") {
      return html`<p class="model-hub__error" role="alert">${state.message}</p>`;
    }
    if (state.files.length === 0) {
      return html`<p class="model-hub__hint">${t("modelHub.noGgufFiles")}</p>`;
    }
    return html`
      <ul class="model-hub__list">
        ${state.files.map(
          (file) => html`
            <li class="model-hub__file">
              <span class="model-hub__file-path">${file.path}</span>
              <span class="model-hub__file-size"
                >${file.size !== undefined ? formatBytes(file.size) : "—"}</span
              >
              <button
                type="button"
                class="model-hub__download"
                ?disabled=${this.download.phase === "downloading"}
                @click=${() => void this.downloadFile(file.path)}
              >
                ${
                  this.download.phase === "downloading" && this.download.file === file.path
                    ? html`${icons.loader} ${t("modelHub.downloading")}`
                    : html`${icons.arrowDown} ${t("modelHub.download")}`
                }
              </button>
              ${this.renderDownloadStatus(file.path)}
            </li>
          `,
        )}
      </ul>
    `;
  }

  private renderDownloadStatus(file: string): TemplateResult {
    const state = this.download;
    if (state.phase === "idle" || state.file !== file) {
      return html``;
    }
    if (state.phase === "done") {
      return html`<span class="model-hub__download-status"
        >${state.result.reused ? t("modelHub.reused") : t("modelHub.downloaded", { path: state.result.path })}</span
      >`;
    }
    if (state.phase === "error") {
      return html`<span class="model-hub__download-status model-hub__error" role="alert"
        >${state.message}</span
      >`;
    }
    return html``;
  }

  override render() {
    return renderSettingsPage(html`
      ${renderSettingsPageHeader({
        title: titleForRoute("model-hub"),
        subtitle: t("modelHub.subtitle"),
      })}
      <div class="model-hub">
        <input
          type="search"
          class="model-hub__search"
          placeholder=${t("modelHub.searchPlaceholder")}
          .value=${this.query}
          @input=${(event: Event) => this.onQueryInput((event.target as HTMLInputElement).value)}
        />
        ${renderSettingsSection(
          { title: this.selectedRepo ?? t("modelHub.resultsTitle") },
          html`
            ${
              this.selectedRepo
                ? html`${this.renderSpecs()} ${this.renderFiles()}`
                : this.renderRepoList()
            }
          `,
        )}
      </div>
    `);
  }
}

if (!customElements.get("openclaw-model-hub-page")) {
  customElements.define("openclaw-model-hub-page", ModelHubPage);
}
