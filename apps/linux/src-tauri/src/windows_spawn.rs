//! Windows console-window suppression for short-lived helper processes.
//!
//! The desktop shell spawns `cmd.exe`/`powershell.exe` children (the CLI `.cmd`
//! shim and the bundled PowerShell installer). On Windows a console child of a
//! GUI process opens its own console window unless the process creation disables
//! it, so without these flags the app flashes a terminal. Apply them to every
//! console child that must stay invisible; `desktop_node_process` keeps its own
//! job-object flags.

use std::process::Command;

/// `CREATE_NO_WINDOW` (0x0800_0000): run the console child without a console window.
#[cfg(windows)]
pub(crate) const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Suppress the console window for a spawned helper process.
#[cfg(windows)]
pub(crate) fn hide_console_window(command: &mut Command) -> &mut Command {
    use std::os::windows::process::CommandExt;
    // Do not overwrite flags an owner already set (for example a job-object run).
    if command.get_creation_flags() & CREATE_NO_WINDOW == 0 {
        command.creation_flags(command.get_creation_flags() | CREATE_NO_WINDOW);
    }
    command
}

/// No-op on non-Windows platforms: there is no console child window to suppress.
#[cfg(not(windows))]
pub(crate) fn hide_console_window(command: &mut Command) -> &mut Command {
    command
}