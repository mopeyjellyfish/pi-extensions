import { constants } from "node:fs";
import { access, readdir } from "node:fs/promises";
import {
  delimiter,
  dirname,
  extname,
  isAbsolute,
  join,
  parse,
  posix,
  resolve,
  win32,
} from "node:path";

interface ServerCommand {
  readonly args: readonly string[];
  readonly command: string;
}

export interface ServerDefinition {
  readonly commands: readonly ServerCommand[];
  readonly extensions: readonly string[];
  readonly filenames?: readonly string[];
  readonly id: string;
  readonly installHint: string;
  readonly languageIds: Readonly<Record<string, string>>;
  readonly name: string;
  readonly rootMarkers: readonly string[];
}

export interface ResolvedServerCommand extends ServerCommand {
  readonly command: string;
}

function command(command: string, ...args: string[]): ServerCommand {
  return { args, command };
}

function languages(
  entries: readonly (readonly [string, string])[],
): Readonly<Record<string, string>> {
  return Object.fromEntries(entries);
}

export const DEFAULT_SERVER_DEFINITIONS: readonly ServerDefinition[] = [
  {
    commands: [command("typescript-language-server", "--stdio")],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"],
    id: "typescript",
    installHint: "npm install --global typescript typescript-language-server",
    languageIds: languages([
      [".ts", "typescript"],
      [".tsx", "typescriptreact"],
      [".js", "javascript"],
      [".jsx", "javascriptreact"],
      [".mts", "typescript"],
      [".cts", "typescript"],
      [".mjs", "javascript"],
      [".cjs", "javascript"],
    ]),
    name: "TypeScript Language Server",
    rootMarkers: ["tsconfig.json", "jsconfig.json", "package.json"],
  },
  {
    commands: [
      command("basedpyright-langserver", "--stdio"),
      command("pyright-langserver", "--stdio"),
      command("pylsp"),
    ],
    extensions: [".py", ".pyi"],
    id: "python",
    installHint: "pipx install basedpyright",
    languageIds: languages([
      [".py", "python"],
      [".pyi", "python"],
    ]),
    name: "Python Language Server",
    rootMarkers: ["pyrightconfig.json", "pyproject.toml", "setup.py", "requirements.txt"],
  },
  {
    commands: [command("gopls")],
    extensions: [".go"],
    id: "go",
    installHint: "go install golang.org/x/tools/gopls@latest",
    languageIds: languages([[".go", "go"]]),
    name: "gopls",
    rootMarkers: ["go.work", "go.mod"],
  },
  {
    commands: [command("rust-analyzer")],
    extensions: [".rs"],
    id: "rust",
    installHint: "rustup component add rust-analyzer",
    languageIds: languages([[".rs", "rust"]]),
    name: "rust-analyzer",
    rootMarkers: ["Cargo.toml", "rust-project.json"],
  },
  {
    commands: [command("clangd")],
    extensions: [".c", ".h", ".cc", ".cpp", ".cxx", ".hh", ".hpp", ".hxx"],
    id: "clangd",
    installHint: "Install clangd from your platform's LLVM package.",
    languageIds: languages([
      [".c", "c"],
      [".h", "c"],
      [".cc", "cpp"],
      [".cpp", "cpp"],
      [".cxx", "cpp"],
      [".hh", "cpp"],
      [".hpp", "cpp"],
      [".hxx", "cpp"],
    ]),
    name: "clangd",
    rootMarkers: ["compile_commands.json", "compile_flags.txt", ".clangd", "CMakeLists.txt"],
  },
  {
    commands: [command("jdtls")],
    extensions: [".java"],
    id: "java",
    installHint: "Install Eclipse JDT Language Server and expose its jdtls launcher on PATH.",
    languageIds: languages([[".java", "java"]]),
    name: "Eclipse JDT Language Server",
    rootMarkers: ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle"],
  },
  {
    commands: [command("csharp-ls")],
    extensions: [".cs"],
    id: "csharp",
    installHint: "dotnet tool install --global csharp-ls",
    languageIds: languages([[".cs", "csharp"]]),
    name: "C# Language Server",
    rootMarkers: ["*.sln", "*.csproj", "global.json"],
  },
  {
    commands: [command("ruby-lsp")],
    extensions: [".rb", ".rake"],
    filenames: ["Gemfile", "Rakefile"],
    id: "ruby",
    installHint: "gem install ruby-lsp",
    languageIds: languages([
      [".rb", "ruby"],
      [".rake", "ruby"],
      ["Gemfile", "ruby"],
      ["Rakefile", "ruby"],
    ]),
    name: "Ruby LSP",
    rootMarkers: ["Gemfile", ".ruby-version"],
  },
  {
    commands: [command("phpactor", "language-server")],
    extensions: [".php"],
    id: "php",
    installHint: "Install phpactor and expose it on PATH.",
    languageIds: languages([[".php", "php"]]),
    name: "Phpactor",
    rootMarkers: ["composer.json", ".phpactor.json"],
  },
  {
    commands: [command("lua-language-server")],
    extensions: [".lua"],
    id: "lua",
    installHint: "Install lua-language-server and expose it on PATH.",
    languageIds: languages([[".lua", "lua"]]),
    name: "Lua Language Server",
    rootMarkers: [".luarc.json", ".luarc.jsonc", ".git"],
  },
  {
    commands: [command("sourcekit-lsp")],
    extensions: [".swift"],
    id: "swift",
    installHint: "Install Swift or Xcode with sourcekit-lsp.",
    languageIds: languages([[".swift", "swift"]]),
    name: "SourceKit-LSP",
    rootMarkers: ["Package.swift", ".git"],
  },
  {
    commands: [command("kotlin-language-server")],
    extensions: [".kt", ".kts"],
    id: "kotlin",
    installHint: "Install kotlin-language-server and expose it on PATH.",
    languageIds: languages([
      [".kt", "kotlin"],
      [".kts", "kotlin"],
    ]),
    name: "Kotlin Language Server",
    rootMarkers: ["settings.gradle", "settings.gradle.kts", "build.gradle", "build.gradle.kts"],
  },
  {
    commands: [command("elixir-ls"), command("language_server.sh")],
    extensions: [".ex", ".exs"],
    id: "elixir",
    installHint: "Install ElixirLS and expose elixir-ls or language_server.sh on PATH.",
    languageIds: languages([
      [".ex", "elixir"],
      [".exs", "elixir"],
    ]),
    name: "ElixirLS",
    rootMarkers: ["mix.exs"],
  },
  {
    commands: [command("bash-language-server", "start")],
    extensions: [".sh", ".bash", ".zsh"],
    id: "bash",
    installHint: "npm install --global bash-language-server",
    languageIds: languages([
      [".sh", "shellscript"],
      [".bash", "shellscript"],
      [".zsh", "shellscript"],
    ]),
    name: "Bash Language Server",
    rootMarkers: [".git"],
  },
  {
    commands: [command("yaml-language-server", "--stdio")],
    extensions: [".yaml", ".yml"],
    id: "yaml",
    installHint: "npm install --global yaml-language-server",
    languageIds: languages([
      [".yaml", "yaml"],
      [".yml", "yaml"],
    ]),
    name: "YAML Language Server",
    rootMarkers: [".git"],
  },
  {
    commands: [command("vscode-json-language-server", "--stdio")],
    extensions: [".json", ".jsonc"],
    id: "json",
    installHint: "npm install --global vscode-langservers-extracted",
    languageIds: languages([
      [".json", "json"],
      [".jsonc", "jsonc"],
    ]),
    name: "VS Code JSON Language Server",
    rootMarkers: ["package.json", ".git"],
  },
  {
    commands: [command("vscode-html-language-server", "--stdio")],
    extensions: [".html", ".htm"],
    id: "html",
    installHint: "npm install --global vscode-langservers-extracted",
    languageIds: languages([
      [".html", "html"],
      [".htm", "html"],
    ]),
    name: "VS Code HTML Language Server",
    rootMarkers: ["package.json", ".git"],
  },
  {
    commands: [command("vscode-css-language-server", "--stdio")],
    extensions: [".css", ".scss", ".less"],
    id: "css",
    installHint: "npm install --global vscode-langservers-extracted",
    languageIds: languages([
      [".css", "css"],
      [".scss", "scss"],
      [".less", "less"],
    ]),
    name: "VS Code CSS Language Server",
    rootMarkers: ["package.json", ".git"],
  },
  {
    commands: [command("vue-language-server", "--stdio")],
    extensions: [".vue"],
    id: "vue",
    installHint: "npm install --global @vue/language-server",
    languageIds: languages([[".vue", "vue"]]),
    name: "Vue Language Server",
    rootMarkers: ["vue.config.js", "vite.config.ts", "package.json"],
  },
  {
    commands: [command("svelteserver", "--stdio")],
    extensions: [".svelte"],
    id: "svelte",
    installHint: "npm install --global svelte-language-server",
    languageIds: languages([[".svelte", "svelte"]]),
    name: "Svelte Language Server",
    rootMarkers: ["svelte.config.js", "package.json"],
  },
  {
    commands: [command("docker-langserver", "--stdio")],
    extensions: [],
    filenames: ["Dockerfile"],
    id: "docker",
    installHint: "npm install --global dockerfile-language-server-nodejs",
    languageIds: languages([["Dockerfile", "dockerfile"]]),
    name: "Dockerfile Language Server",
    rootMarkers: ["compose.yaml", "compose.yml", "Dockerfile", ".git"],
  },
  {
    commands: [command("terraform-ls", "serve")],
    extensions: [".tf", ".tfvars"],
    id: "terraform",
    installHint: "Install terraform-ls from HashiCorp.",
    languageIds: languages([
      [".tf", "terraform"],
      [".tfvars", "terraform-vars"],
    ]),
    name: "Terraform Language Server",
    rootMarkers: [".terraform", ".git"],
  },
];

export function languageKey(filePath: string): string {
  const base = filePath.slice(Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1);
  return extname(base).toLowerCase() || base;
}

export function findServerDefinitions(filePath: string): readonly ServerDefinition[] {
  const key = languageKey(filePath);
  const base = filePath.slice(Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")) + 1);
  return DEFAULT_SERVER_DEFINITIONS.filter(
    (server) => server.extensions.includes(key) || server.filenames?.includes(base) === true,
  );
}

async function exists(path: string, executable = false): Promise<boolean> {
  try {
    await access(
      path,
      executable && process.platform !== "win32" ? constants.X_OK : constants.F_OK,
    );
    return true;
  } catch {
    return false;
  }
}

export function isPathInside(
  root: string,
  target: string,
  platform: NodeJS.Platform = process.platform,
): boolean {
  const paths = platform === "win32" ? win32 : posix;
  const path = paths.relative(paths.resolve(root), paths.resolve(target));
  return path === "" || (!path.startsWith("..") && !paths.isAbsolute(path));
}

async function hasRootMarker(directory: string, marker: string): Promise<boolean> {
  if (!marker.startsWith("*.")) return exists(join(directory, marker));
  try {
    const suffix = marker.slice(1);
    const entries = await readdir(directory);
    return entries.some((entry) =>
      process.platform === "win32"
        ? entry.toLowerCase().endsWith(suffix.toLowerCase())
        : entry.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export async function findWorkspaceRoot(
  filePath: string,
  rootMarkers: readonly string[],
  fallbackRoot: string,
): Promise<string> {
  let current = dirname(resolve(filePath));
  const filesystemRoot = parse(current).root;
  const resolvedFallback = resolve(fallbackRoot);
  if (!isPathInside(resolvedFallback, current)) return resolvedFallback;
  for (;;) {
    for (const marker of rootMarkers) {
      if (await hasRootMarker(current, marker)) return current;
    }
    if (current === filesystemRoot || current === resolvedFallback) break;
    const parent = dirname(current);
    if (!isPathInside(resolvedFallback, parent)) break;
    current = parent;
  }
  return resolvedFallback;
}

function executableNames(
  commandName: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
): readonly string[] {
  if (platform !== "win32") return [commandName];
  if (extname(commandName)) return [commandName];
  const extensions = (env["PATHEXT"] ?? ".COM;.EXE;.BAT;.CMD").split(";");
  return [
    commandName,
    ...extensions.map((extension) => `${commandName}${extension.toLowerCase()}`),
  ];
}

function trustedLocalDirectories(
  root: string,
  trusted: boolean,
  trustedRoot: string,
  platform: NodeJS.Platform,
): string[] {
  const directories: string[] = [];
  if (!trusted || !isPathInside(trustedRoot, root, platform)) return directories;
  let current = resolve(root);
  const boundary = resolve(trustedRoot);
  for (;;) {
    directories.push(
      join(current, "node_modules", ".bin"),
      join(current, ".venv", "bin"),
      join(current, ".venv", "Scripts"),
    );
    if (isPathInside(current, boundary, platform)) break;
    const parent = dirname(current);
    if (!isPathInside(boundary, parent, platform) || parent === current) break;
    current = parent;
  }
  return directories;
}

export async function resolveServerCommand(
  definition: ServerDefinition,
  root: string,
  trusted: boolean,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  trustedRoot: string = root,
): Promise<ResolvedServerCommand | undefined> {
  const localDirectories = trustedLocalDirectories(root, trusted, trustedRoot, platform);
  const pathDirectories = (env["PATH"] ?? "").split(delimiter).filter(Boolean);
  for (const candidate of definition.commands) {
    if (isAbsolute(candidate.command) && (await exists(candidate.command, true))) {
      return { ...candidate, command: candidate.command };
    }
    for (const directory of [...localDirectories, ...pathDirectories]) {
      for (const name of executableNames(candidate.command, env, platform)) {
        const resolvedCommand = resolve(directory, name);
        if (await exists(resolvedCommand, true)) {
          return { args: candidate.args, command: resolvedCommand };
        }
      }
    }
  }
  return undefined;
}
