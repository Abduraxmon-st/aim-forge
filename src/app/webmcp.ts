import { scenarioId } from "../domain/models";
import { catalog } from "../engine/scenarios/catalog";
import { localizeHref, splitLocalizedPath } from "../i18n/languages";
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
export function registerTools() {
  const doc = document as Document & {
    modelContext?: {
      registerTool: (
        tool: Tool,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
  };
  const context = doc.modelContext;
  if (!context) return () => {};
  const lifecycle = new AbortController();
  const tools: Tool[] = [
    {
      name: "list_training_scenarios",
      description:
        "List available local training scenarios and their skill categories. No personal history is exposed.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => catalog,
    },
    {
      name: "open_scenario_setup",
      description:
        "Open scenario setup. Does not start gameplay or request pointer lock.",
      inputSchema: {
        type: "object",
        properties: {
          scenario: { type: "string", enum: catalog.map((s) => s.id) },
        },
        required: ["scenario"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const id = scenarioId.parse(
          (input as { scenario?: unknown })?.scenario,
        );
        location.assign(
          localizeHref(
            "/setup/" + id + "/",
            splitLocalizedPath(location.pathname).locale,
          ),
        );
        return { opened: id, started: false };
      },
    },
  ];
  for (const tool of tools)
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* proposed API is optional */
    }
  return () => lifecycle.abort();
}
