@AGENTS.md

## Claude Code notes
- Follow the process rule in AGENTS.md: start background processes with `$!` saved to a PID file in the
  scratchpad directory, and stop them with `kill "$(cat <pidfile>)"`. Never `pkill -f` (it has killed the
  shell here before).
