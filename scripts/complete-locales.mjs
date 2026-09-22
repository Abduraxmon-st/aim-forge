import { readFile, writeFile } from "node:fs/promises";
const rows = [
  [
    "Training unavailable",
    "Training unavailable",
    "Entrenamiento no disponible",
    "Training nicht verfügbar",
    "Тренировка недоступна",
    "Mashq mavjud emas",
  ],
  [
    "coachReaction",
    "Last three versus previous two comparable runs (n=5): {{delta}} ms change in pooled reaction-time median. Lower is faster. This describes recorded samples, not a prediction.",
    "Últimas tres frente a dos anteriores (n=5): cambio de {{delta}} ms en la mediana conjunta. Menos es más rápido. Describe muestras, no predice.",
    "Letzte drei gegenüber vorherigen zwei (n=5): {{delta}} ms Änderung des gemeinsamen Reaktionsmedians. Weniger ist schneller. Beschreibung, keine Vorhersage.",
    "Последние три против предыдущих двух (n=5): изменение общей медианы реакции на {{delta}} мс. Меньше — быстрее. Описание, не прогноз.",
    "So‘nggi uchta va oldingi ikkita (n=5): birlashtirilgan reaksiya medianasida {{delta}} ms o‘zgarish. Kamroq — tezroq. Bu tavsif, bashorat emas.",
  ],
];
for (const [i, lang] of ["en", "es", "de", "ru", "uz"].entries()) {
  const file = "src/i18n/locales/" + lang + ".json";
  const data = JSON.parse(await readFile(file, "utf8"));
  for (const r of rows) data[r[0]] = r[i + 1];
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
}
