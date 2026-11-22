export interface ParsedCliArgs {
  command?: string;
  configPath?: string;
  outputPath?: string;
  help: boolean;
  error?: string;
}

export function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  if (argv.length === 0) {
    return { help: true };
  }

  let command: string | undefined;
  let configPath: string | undefined;
  let outputPath: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (arg === "-h" || arg === "--help") {
      return { help: true };
    }

    if (arg === "--output" || arg === "-o") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        return { help: false, error: `Missing file path after ${arg}` };
      }
      outputPath = next;
      i += 1;
      continue;
    }

    if (arg.startsWith("--output=")) {
      const value = arg.slice("--output=".length);
      if (!value) {
        return { help: false, error: "Missing file path after --output=" };
      }
      outputPath = value;
      continue;
    }

    if (arg.startsWith("-")) {
      return { help: false, error: `Unknown option: ${arg}` };
    }

    if (!command) {
      command = arg;
    } else if (configPath) {
      return { help: false, error: `Unexpected argument: ${arg}` };
    } else {
      configPath = arg;
    }
  }

  if (!command || command === "help") {
    return { help: true };
  }

  return {
    command,
    ...(configPath !== undefined && { configPath }),
    ...(outputPath !== undefined && { outputPath }),
    help: false,
  };
}
