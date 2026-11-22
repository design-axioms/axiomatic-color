import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./args.ts";

describe("parseCliArgs", () => {
  it("shows help when invoked with no arguments or help flags", () => {
    expect(parseCliArgs([])).toEqual({ help: true });
    expect(parseCliArgs(["help"])).toEqual({ help: true });
    expect(parseCliArgs(["--help"])).toEqual({ help: true });
    expect(parseCliArgs(["build", "-h"])).toEqual({ help: true });
  });

  it("parses --output and -o without a positional config path", () => {
    expect(parseCliArgs(["build", "--output", "theme.css"])).toEqual({
      command: "build",
      outputPath: "theme.css",
      help: false,
    });
    expect(parseCliArgs(["build", "-o", "axiomatic.css"])).toEqual({
      command: "build",
      outputPath: "axiomatic.css",
      help: false,
    });
    expect(parseCliArgs(["demo", "--output=demo-app.html"])).toEqual({
      command: "demo",
      outputPath: "demo-app.html",
      help: false,
    });
  });

  it("parses positional config alongside --output in either order", () => {
    expect(parseCliArgs(["build", "my-config.json", "--output", "theme.css"])).toEqual({
      command: "build",
      configPath: "my-config.json",
      outputPath: "theme.css",
      help: false,
    });
    expect(parseCliArgs(["demo", "-o", "out.html", "my-config.json"])).toEqual({
      command: "demo",
      configPath: "my-config.json",
      outputPath: "out.html",
      help: false,
    });
  });

  it("reports errors for missing output path or unknown flags", () => {
    expect(parseCliArgs(["build", "-o"]).error).toMatch(/Missing file path/);
    expect(parseCliArgs(["build", "--output="]).error).toMatch(/Missing file path/);
    expect(parseCliArgs(["build", "--bogus"]).error).toMatch(/Unknown option/);
  });
});
