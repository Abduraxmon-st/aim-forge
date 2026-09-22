import { notFound } from "next/navigation";
import { scenarioIds } from "../domain/models";
import type { Locale } from "../i18n/languages";
import { resources } from "../i18n/resources";
import App from "../app/App";
import { LocalizedRuntime } from "./LocalizedRuntime";
import { publicMetadata, privateMetadata } from "./metadata";
import { PublicHome, PublicTraining, PublicHelp, GamePage } from "./pages";

const appRoutes = [
  "dashboard",
  "history",
  "challenges",
  "routines",
  "achievements",
  "settings",
  "arena",
  "results",
  "onboarding",
];
export function localizedStaticParams() {
  return [
    [],
    ["training"],
    ["help"],
    ...scenarioIds.map((id) => ["games", id]),
    ...appRoutes.map((path) => [path]),
    ...scenarioIds.map((id) => ["setup", id]),
  ].map((path) => ({ path }));
}
export function legacyRouteTitle(locale: Locale, parts: string[]) {
  const dictionary = resources[locale].translation as Record<string, string>;
  const labels: Record<string, string> = {
    training: "Training library",
    dashboard: "My progress",
    history: "Session history",
    challenges: "Daily challenges",
    routines: "Routines",
    achievements: "Achievements",
    settings: "Settings",
    help: "Help & privacy",
    arena: "Training arena",
    results: "Session complete.",
    onboarding: "A space for your practice.",
  };
  return parts[0] === "setup"
    ? (dictionary[parts[1]] ?? "AimForge")
    : (dictionary[labels[parts[0]]] ?? "AimForge");
}
function resolvePage(parts: string[]) {
  if (!parts.length) return { kind: "home" } as const;
  if (parts.length === 1 && parts[0] === "training")
    return { kind: "training" } as const;
  if (parts.length === 1 && parts[0] === "help")
    return { kind: "help" } as const;
  if (
    parts.length === 2 &&
    parts[0] === "games" &&
    scenarioIds.includes(parts[1] as (typeof scenarioIds)[number])
  )
    return {
      kind: "game",
      id: parts[1] as (typeof scenarioIds)[number],
    } as const;
  if (
    (parts.length === 1 && appRoutes.includes(parts[0])) ||
    (parts.length === 2 &&
      parts[0] === "setup" &&
      scenarioIds.includes(parts[1] as (typeof scenarioIds)[number]))
  )
    return { kind: "app" } as const;
  notFound();
}
export function localizedMetadata(locale: Locale, parts: string[] = []) {
  const page = resolvePage(parts);
  return page.kind === "app"
    ? privateMetadata(locale, legacyRouteTitle(locale, parts))
    : publicMetadata(
        locale,
        page.kind,
        page.kind === "game" ? page.id : undefined,
      );
}
export function localizedPage(locale: Locale, parts: string[] = []) {
  const page = resolvePage(parts);
  const content =
    page.kind === "home" ? (
      <PublicHome locale={locale} />
    ) : page.kind === "training" ? (
      <PublicTraining locale={locale} />
    ) : page.kind === "help" ? (
      <PublicHelp locale={locale} />
    ) : page.kind === "game" ? (
      <GamePage locale={locale} id={page.id} />
    ) : (
      <App locale={locale} />
    );
  return <LocalizedRuntime locale={locale}>{content}</LocalizedRuntime>;
}
