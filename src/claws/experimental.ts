const EXPERIMENTAL_CLAWS_ENV = "OPENCLAW_EXPERIMENTAL_CLAWS";

/** Claws are enabled by default; set OPENCLAW_EXPERIMENTAL_CLAWS=0 to opt out. */
export function isExperimentalClawsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env[EXPERIMENTAL_CLAWS_ENV]?.trim().toLowerCase();
  return value !== "0" && value !== "false";
}

export function assertExperimentalClawsEnabled(env: NodeJS.ProcessEnv = process.env): void {
  if (isExperimentalClawsEnabled(env)) {
    return;
  }
  throw new Error(
    `Claws are disabled for this process. Unset ${EXPERIMENTAL_CLAWS_ENV} or set it to 1 to enable the experimental CLI.`,
  );
}
