// oxlint-disable-next-line typescript/consistent-type-imports
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  // oxlint-disable-next-line typescript/no-empty-object-type
  // oxlint-disable-next-line typescript/no-empty-object-type
  interface Locals extends Runtime {}
}
