import {
  ErrorCodes,
  errorShape,
  type ModelsHubDownloadParams,
  type ModelsHubFilesParams,
  type ModelsHubSearchParams,
  type ModelsHubSpecsParams,
  validateModelsHubDownloadParams,
  validateModelsHubFilesParams,
  validateModelsHubSearchParams,
  validateModelsHubSpecsParams,
} from "../../../packages/gateway-protocol/src/index.js";
import { formatForLog } from "../ws-log.js";
import {
  ModelHubError,
  downloadHubGgufFile,
  listHubGgufFiles,
  readHubSpecs,
  searchHubRepos,
} from "./model-hub-client.js";
import type { GatewayRequestHandlers } from "./types.js";
import { assertValidParams } from "./validation.js";

const MISSING_REPO_MESSAGE = "repo must not be blank";

function respondHubFailure(
  respond: Parameters<GatewayRequestHandlers[string]>[0]["respond"],
  err: unknown,
): void {
  const message = err instanceof ModelHubError ? err.message : formatForLog(err);
  respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, message));
}

export const modelsHubHandlers: GatewayRequestHandlers = {
  "models.hub.search": async ({ params, respond, signal }) => {
    if (!assertValidParams(params, validateModelsHubSearchParams, "models.hub.search", respond)) {
      return;
    }
    const request = params as ModelsHubSearchParams;
    if (request.author !== undefined && !request.author.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "author must not be blank"));
      return;
    }
    try {
      respond(true, await searchHubRepos(request, { signal }));
    } catch (err) {
      respondHubFailure(respond, err);
    }
  },

  "models.hub.files": async ({ params, respond, signal }) => {
    if (!assertValidParams(params, validateModelsHubFilesParams, "models.hub.files", respond)) {
      return;
    }
    const request = params as ModelsHubFilesParams;
    if (!request.repo.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, MISSING_REPO_MESSAGE));
      return;
    }
    try {
      respond(true, await listHubGgufFiles(request, { signal }));
    } catch (err) {
      respondHubFailure(respond, err);
    }
  },

  "models.hub.specs": async ({ params, respond, signal }) => {
    if (!assertValidParams(params, validateModelsHubSpecsParams, "models.hub.specs", respond)) {
      return;
    }
    const request = params as ModelsHubSpecsParams;
    if (!request.repo.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, MISSING_REPO_MESSAGE));
      return;
    }
    try {
      respond(true, await readHubSpecs(request, { signal }));
    } catch (err) {
      respondHubFailure(respond, err);
    }
  },

  "models.hub.download": async ({ params, respond, signal }) => {
    if (
      !assertValidParams(params, validateModelsHubDownloadParams, "models.hub.download", respond)
    ) {
      return;
    }
    const request = params as ModelsHubDownloadParams;
    if (!request.repo.trim()) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, MISSING_REPO_MESSAGE));
      return;
    }
    try {
      respond(true, await downloadHubGgufFile(request, { signal }));
    } catch (err) {
      respondHubFailure(respond, err);
    }
  },
};
