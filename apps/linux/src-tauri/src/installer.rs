#[cfg(not(target_os = "windows"))]
use crate::cli::openclaw_home;
use crate::cli::{OpenClawCli, SpawnCommand};
use serde::Deserialize;
use serde::Serialize;
use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use tauri::path::BaseDirectory;
use tauri::AppHandle;
use tauri::{Emitter, Manager};

const INSTALL_EVENT: &str = "install-progress";
const ERROR_TAIL_LINES: usize = 24;

/// Repository the Windows installer checks out, so the installed agent is this
/// fork rather than the upstream npm package. Overridable for mirrors/testing.
#[cfg(target_os = "windows")]
fn fork_git_url() -> String {
    std::env::var("OPENCLAW_FORK_GIT_URL").unwrap_or_else(|_| {
        "https://github.com/wasimmostakim2965-ui/Open-Wai.git".to_string()
    })
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallChannel {
    Stable,
    Beta,
    Dev,
}

impl InstallChannel {
    #[cfg(not(target_os = "windows"))]
    fn version(self) -> &'static str {
        match self {
            Self::Stable => "latest",
            Self::Beta => "beta",
            Self::Dev => "main",
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallProgress<'a> {
    stream: &'a str,
    line: &'a str,
}

/// Windows install path. Prefer a bundled, self-contained runtime archive
/// (portable Node.js + agent + dependencies, offline and single-shot); fall back
/// to a bundled agent package (dependencies fetched from npm), then to a source
/// checkout of this fork. Either way the installed agent is THIS fork.
#[cfg(target_os = "windows")]
pub fn install(app: &AppHandle, _channel: InstallChannel) -> Result<(), String> {
    if let Some(runtime) = bundled_runtime_archive(app) {
        return install_from_runtime(app, &runtime);
    }
    if let Some(package) = bundled_agent_package(app) {
        return install_from_package(app, &package);
    }
    install_from_git(app)
}

/// Path to a self-contained runtime `.zip` bundled as a resource, when the
/// installer shipped one. Its presence means a first run needs no npm, git, or
/// network access.
#[cfg(target_os = "windows")]
fn bundled_runtime_archive(app: &AppHandle) -> Option<std::path::PathBuf> {
    let path = app
        .path()
        .resolve("openclaw-runtime.zip", BaseDirectory::Resource)
        .ok()?;
    path.is_file().then_some(path)
}

#[cfg(target_os = "windows")]
fn install_from_runtime(app: &AppHandle, runtime: &std::path::Path) -> Result<(), String> {
    let mut command = windows_installer_command(app)?;
    command
        .args(["-NoOnboard"])
        .arg("-RuntimeArchive")
        .arg(runtime);
    run_installer(app, command, false, None)
}

/// Path to an agent `.tgz` bundled as a resource, when the installer shipped
/// one. Absence is not an error: we then install from git.
#[cfg(target_os = "windows")]
fn bundled_agent_package(app: &AppHandle) -> Option<std::path::PathBuf> {
    let path = app.path().resolve("openclaw.tgz", BaseDirectory::Resource).ok()?;
    path.is_file().then_some(path)
}

#[cfg(target_os = "windows")]
fn install_from_package(app: &AppHandle, package: &std::path::Path) -> Result<(), String> {
    let mut command = windows_installer_command(app)?;
    command
        .args(["-NoOnboard"])
        .arg("-Tag")
        .arg(package);
    run_installer(app, command, false, None)
}

#[cfg(target_os = "windows")]
fn install_from_git(app: &AppHandle) -> Result<(), String> {
    let mut command = windows_installer_command(app)?;
    command
        .args(["-NoOnboard", "-InstallMethod", "git", "-Tag", "main"])
        .env("OPENCLAW_GIT_REPO_URL", fork_git_url());
    run_installer(app, command, false, None)
}

#[cfg(target_os = "windows")]
fn windows_installer_command(app: &AppHandle) -> Result<Command, String> {
    let script = app
        .path()
        .resolve("install.ps1", BaseDirectory::Resource)
        .map_err(|error| format!("Bundled installer is unavailable: {error}"))?;
    let mut command = Command::new("powershell.exe");
    command
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-File"])
        .arg(script);
    // The GUI app must not flash a console for the installer child.
    crate::windows_spawn::hide_console_window(&mut command);
    Ok(command)
}

fn configure_installer_environment(command: &mut Command) {
    // The AppImage runtime exports its bundled usr/lib (Ubuntu 22.04, OpenSSL 3.0)
    // through LD_LIBRARY_PATH. The bundled installer drives host tools (curl, wget,
    // tar, git, and the downloaded Node), so they must resolve against host
    // libraries. Otherwise a newer host libcurl loads the older bundled libssl and
    // aborts with "OPENSSL_3.2.0 not found" (issue #146088). No-op on Windows.
    #[cfg(not(target_os = "windows"))]
    command.env_remove("LD_LIBRARY_PATH");
    #[cfg(target_os = "windows")]
    let _ = command;
}

#[cfg(not(target_os = "windows"))]
pub fn install(app: &AppHandle, channel: InstallChannel) -> Result<(), String> {
    let prefix = openclaw_home().map_err(|error| error.to_string())?;
    install_at(app, channel, prefix, channel.version(), false, None)
}

#[cfg(target_os = "windows")]
pub(crate) fn browser_runtime(
    _app: &AppHandle,
    _allow_install: bool,
    _is_current: &dyn Fn() -> bool,
    _spawn: &SpawnCommand<'_>,
) -> Result<OpenClawCli, String> {
    Err("Preparing the browser runtime is not supported on Windows.".into())
}

#[cfg(not(target_os = "windows"))]
pub(crate) fn browser_runtime(
    app: &AppHandle,
    allow_install: bool,
    is_current: &dyn Fn() -> bool,
    spawn: &SpawnCommand<'_>,
) -> Result<OpenClawCli, String> {
    let version = app.package_info().version.to_string();
    let release_build = crate::is_release_version(&version);
    if let Ok(cli) = OpenClawCli::discover() {
        if !release_build || cli.matches_version(&version) {
            return Ok(cli);
        }
    }
    if !release_build {
        return Err("Development builds need a local OpenClaw CLI for Chrome setup.".into());
    }
    // A missing CLI wrapper does not prove a Gateway has stopped using its package.
    // Keep browser-only downloads outside that install and pin them to this app release.
    let prefix = app
        .path()
        .app_local_data_dir()
        .map_err(|error| format!("Browser runtime location is unavailable: {error}"))?
        .join("browser-runtime")
        .join(&version);
    for directory in [
        prefix.parent().expect("versioned runtime parent"),
        prefix.as_path(),
    ] {
        match std::fs::symlink_metadata(directory) {
            Ok(metadata) if metadata.is_dir() && !metadata.file_type().is_symlink() => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            _ => return Err("Browser runtime directory is unavailable or redirected.".into()),
        }
    }
    if let Ok(cli) = OpenClawCli::browser_runtime(prefix.clone()) {
        if cli.matches_version(&version) {
            return Ok(cli);
        }
    }
    // This reserved app-data artifact may be incomplete after an interrupted download.
    // The canonical installer can repair it without touching the ordinary Gateway install.
    if !allow_install {
        return Err("Prepare the local browser runtime with the install action first.".into());
    }
    if !is_current() {
        return Err("The native browser document changed.".into());
    }
    install_at(
        app,
        InstallChannel::Stable,
        prefix.clone(),
        &version,
        true,
        Some(spawn),
    )?;
    let cli = OpenClawCli::browser_runtime(prefix).map_err(|error| error.to_string())?;
    if !cli.matches_version(&version) {
        return Err("The browser runtime does not match this app version.".into());
    }
    Ok(cli)
}

#[cfg(not(target_os = "windows"))]
fn install_at(
    app: &AppHandle,
    channel: InstallChannel,
    prefix: std::path::PathBuf,
    version: &str,
    runtime_only: bool,
    spawn: Option<&SpawnCommand<'_>>,
) -> Result<(), String> {
    let script = app
        .path()
        .resolve("install-cli.sh", BaseDirectory::Resource)
        .map_err(|error| format!("Bundled installer is unavailable: {error}"))?;
    let mut command = Command::new("bash");
    configure_installer_environment(&mut command);
    command
        .arg(script)
        .args(["--json", "--no-onboard", "--prefix"])
        .arg(&prefix)
        .args(["--version", version]);
    if runtime_only {
        command.args(["--runtime-only", "--npm"]);
    }
    if matches!(channel, InstallChannel::Dev) {
        command
            .args(["--install-method", "git", "--git-dir"])
            .arg(prefix.join("dev/openclaw"));
    }
    crate::windows_spawn::hide_console_window(&mut command);
    run_installer(app, command, runtime_only, spawn)
}

/// Spawn an installer command, stream its stdout/stderr to the UI as
/// `install-progress` events, and return a diagnostic error on failure. Shared
/// by the Windows package/git install paths and the shell installer path.
fn run_installer(
    app: &AppHandle,
    mut command: Command,
    runtime_only: bool,
    spawn: Option<&SpawnCommand<'_>>,
) -> Result<(), String> {
    configure_installer_environment(&mut command);
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = match spawn {
        Some(spawn) => spawn(&mut command),
        None => command.spawn().map_err(|error| error.to_string()),
    }
    .map_err(|error| format!("Could not start the bundled installer: {error}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Could not read installer output".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Could not read installer errors".to_string())?;
    let (sender, receiver) = mpsc::channel::<(&'static str, String)>();

    let stdout_thread = stream_lines("stdout", stdout, sender.clone());
    let stderr_thread = stream_lines("stderr", stderr, sender);
    let mut tail = VecDeque::with_capacity(ERROR_TAIL_LINES);
    for (stream, line) in receiver {
        if !runtime_only {
            let _ = app.emit_to(
                "main",
                INSTALL_EVENT,
                InstallProgress {
                    stream,
                    line: &line,
                },
            );
        }
        // Structured step events belong to the log pane; the failure tail is
        // shown as prose and must keep only human-readable diagnostics.
        if serde_json::from_str::<serde_json::Value>(&line)
            .is_ok_and(|value| value.get("event").is_some())
        {
            continue;
        }
        if tail.len() == ERROR_TAIL_LINES {
            tail.pop_front();
        }
        tail.push_back(line);
    }

    let status = child
        .wait()
        .map_err(|error| format!("Could not wait for the bundled installer: {error}"))?;
    let _ = stdout_thread.join();
    let _ = stderr_thread.join();
    if status.success() {
        return Ok(());
    }
    let detail = tail.into_iter().collect::<Vec<_>>().join("\n");
    if detail.is_empty() {
        Err(format!("Installer exited with {status}"))
    } else {
        Err(format!("Installer exited with {status}\n{detail}"))
    }
}

fn stream_lines<R>(
    stream: &'static str,
    reader: R,
    sender: mpsc::Sender<(&'static str, String)>,
) -> thread::JoinHandle<()>
where
    R: std::io::Read + Send + 'static,
{
    thread::spawn(move || {
        for line in BufReader::new(reader).lines().map_while(Result::ok) {
            if sender.send((stream, line)).is_err() {
                break;
            }
        }
    })
}

#[cfg(all(test, not(target_os = "windows")))]
mod tests {
    use super::configure_installer_environment;
    use std::process::Command;

    #[test]
    fn installer_child_does_not_inherit_the_appimage_library_path() {
        let mut command = Command::new("sh");
        command
            .args(["-c", "printf '%s' \"${LD_LIBRARY_PATH-unset}\""])
            .env("LD_LIBRARY_PATH", "/tmp/appimage/usr/lib");
        configure_installer_environment(&mut command);

        let output = command.output().expect("installer environment probe");
        assert!(output.status.success(), "probe failed: {output:?}");
        assert_eq!(
            String::from_utf8_lossy(&output.stdout),
            "unset",
            "the installer child must not inherit the AppImage library path"
        );
    }
}
