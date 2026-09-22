import type { Config } from "../domain/models";
import en from "../i18n/locales/en.json";
import es from "../i18n/locales/es.json";
import de from "../i18n/locales/de.json";
import ru from "../i18n/locales/ru.json";
import uz from "../i18n/locales/uz.json";
import type { Locale } from "../i18n/languages";
export {
  supportedLocales,
  localeNames,
  isLocale,
  type Locale,
} from "../i18n/languages";

/** Plain data only: safe to render into static HTML without client i18n. */
export type ScenarioId = Config["scenario"];

export interface PageCopy {
  title: string;
  description: string;
  heading: string;
  intro: string;
}
export interface SeoCopy {
  nav: { home: string; training: string; help: string; openApp: string };
  home: PageCopy & { features: { title: string; body: string }[] };
  training: PageCopy;
  help: PageCopy & { sections: { id: string; title: string; body: string }[] };
  labels: {
    play: string;
    setup: string;
    gameplay: string;
    screenshots: string;
    relatedGames: string;
    language: string;
    howTo: string;
    tips: string;
    controls: string;
    scoring: string;
    requirements: string;
    faq: string;
    quickFacts: string;
    dimension: string;
    skill: string;
    duration: string;
    devices: string;
    difficulty: string;
    allGames: string;
    backToLibrary: string;
  };
  facts: {
    timed: string;
    reaction: string;
    mouseTouch: string;
    desktopMouse: string;
    difficulties: string;
  };
  skills: Record<
    "flicking" | "precision" | "tracking" | "reaction" | "switching",
    string
  >;
}
export interface GameCopy {
  name: string;
  title: string;
  description: string;
  intro: string;
  howTo: string[];
  tips: string[];
  controls: string;
  scoring: string;
  requirements: string;
  faq: { question: string; answer: string }[];
}

const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  es,
  de,
  ru,
  uz,
};
const t = (locale: Locale, key: keyof typeof en) => dictionaries[locale][key];
const helpTopics = [
  "controls",
  "metrics",
  "comparisons",
  "streaks",
  "privacy",
  "retention",
  "browser",
  "offline",
  "accessibility",
] as const;

type PublicCopy = Omit<SeoCopy, "nav" | "help" | "skills"> & {
  help: PageCopy;
  openApp: string;
};
const publicCopy: Record<Locale, PublicCopy> = {
  en: {
    openApp: "Open training app",
    home: {
      title: "AimForge — Free browser aim trainer in 2D & 3D",
      description:
        "Practice flicks, precision, tracking and reaction time with 10 free browser aim games. Local progress, custom routines and offline training. No account needed.",
      heading: "A focused place to practice your aim.",
      intro:
        "AimForge is a free browser aim trainer with ten distinct 2D and 3D games. Choose a skill, adjust the difficulty and review the results of your own practice. Your training history stays in this browser, with no account or cloud sync.",
      features: [
        {
          title: "Ten ways to practice",
          body: "Move between click timing, small targets, continuous tracking and a ten-trial reaction test. Each game explains its controls and scoring before you start.",
        },
        {
          title: "Results with context",
          body: "Review accuracy, active training time and compatible personal records. Mouse and touch results are separated, and interrupted rounds remain practice.",
        },
        {
          title: "Your own training rhythm",
          body: "Build routines, try seeded daily challenges and export your progress. Prepare both engines in Settings to use the app offline after the download succeeds.",
        },
      ],
    },
    training: {
      title: "10 free aim training games — 2D & 3D | AimForge",
      description:
        "Explore ten browser aim training games for flicking, precision, tracking, reaction and target switching. Read each guide, view gameplay and choose a drill.",
      heading: "Find the right drill for your next round.",
      intro:
        "Every game has a different movement pattern and a clear scoring rule. Start with a 2D drill using a mouse or touch, or use a desktop mouse for the first-person 3D arena. The guides below show actual gameplay, controls and practical tips.",
    },
    help: {
      title: "AimForge help, controls & privacy",
      description:
        "Understand AimForge controls, scores, browser requirements, local data, backups and offline preparation. Learn how personal records and training streaks work.",
      heading: "Understand your practice. Control your data.",
      intro:
        "A guide to how AimForge runs, measures sessions and keeps your progress. Training records are local to your browser and are not verified competitive rankings.",
    },
    labels: {
      play: "Play this game",
      setup: "Choose your setup",
      gameplay: "Gameplay preview",
      screenshots: "Game screenshots",
      relatedGames: "Related training games",
      language: "Language",
      howTo: "How to play",
      tips: "Practice tips",
      controls: "Controls",
      scoring: "How scoring works",
      requirements: "Device requirements",
      faq: "Common questions",
      quickFacts: "At a glance",
      dimension: "Dimension",
      skill: "Skill focus",
      duration: "Round length",
      devices: "Input",
      difficulty: "Difficulty",
      allGames: "Explore all games",
      backToLibrary: "Back to training games",
    },
    facts: {
      timed: "30, 60 or 120 seconds",
      reaction: "10 trials",
      mouseTouch: "Mouse or touch",
      desktopMouse: "Desktop mouse",
      difficulties: "Beginner · Intermediate · Advanced",
    },
  },
  es: {
    openApp: "Abrir el entrenador",
    home: {
      title: "AimForge — Entrenador de puntería gratis en 2D y 3D",
      description:
        "Practica puntería, precisión, seguimiento y reacción con 10 juegos gratis en el navegador. Progreso local, rutinas y uso sin conexión. Sin cuenta.",
      heading: "Un espacio para practicar tu puntería.",
      intro:
        "AimForge es un entrenador de puntería gratuito para el navegador con diez juegos en 2D y 3D. Elige una habilidad, ajusta la dificultad y revisa tus resultados. El historial se queda en este navegador, sin cuenta ni sincronización en la nube.",
      features: [
        {
          title: "Diez formas de practicar",
          body: "Alterna entre clics precisos, objetivos pequeños, seguimiento continuo y una prueba de reacción de diez intentos. Cada juego explica sus controles y puntuación antes de empezar.",
        },
        {
          title: "Resultados con contexto",
          body: "Consulta la precisión, el tiempo activo y los récords personales compatibles. Ratón y táctil se registran por separado; las rondas interrumpidas cuentan como práctica.",
        },
        {
          title: "Tu propio ritmo",
          body: "Crea rutinas, prueba retos diarios reproducibles y exporta tu progreso. Prepara ambos motores en Ajustes para jugar sin conexión cuando la descarga termine correctamente.",
        },
      ],
    },
    training: {
      title: "10 juegos de puntería gratis en 2D y 3D | AimForge",
      description:
        "Descubre diez juegos de puntería para practicar precisión, seguimiento, reacción y cambios de objetivo. Consulta guías, controles y capturas de cada juego.",
      heading: "Elige el ejercicio para tu próxima ronda.",
      intro:
        "Cada juego tiene un movimiento distinto y reglas claras de puntuación. Empieza con un ejercicio 2D con ratón o pantalla táctil, o usa un ratón de escritorio en la arena 3D. Las guías muestran el juego real, los controles y consejos de práctica.",
    },
    help: {
      title: "Ayuda, controles y privacidad de AimForge",
      description:
        "Consulta los controles, puntuaciones, requisitos, datos locales, copias de seguridad y modo sin conexión de AimForge. Entiende tus récords y rachas.",
      heading: "Entiende tu práctica. Controla tus datos.",
      intro:
        "Descubre cómo funciona AimForge, cómo mide las sesiones y dónde guarda tu progreso. Los registros son locales y no son clasificaciones competitivas verificadas.",
    },
    labels: {
      play: "Jugar",
      setup: "Configurar la ronda",
      gameplay: "Vista del juego",
      screenshots: "Capturas del juego",
      relatedGames: "Juegos relacionados",
      language: "Idioma",
      howTo: "Cómo jugar",
      tips: "Consejos de práctica",
      controls: "Controles",
      scoring: "Cómo se puntúa",
      requirements: "Requisitos del dispositivo",
      faq: "Preguntas frecuentes",
      quickFacts: "De un vistazo",
      dimension: "Dimensión",
      skill: "Habilidad",
      duration: "Duración",
      devices: "Entrada",
      difficulty: "Dificultad",
      allGames: "Ver todos los juegos",
      backToLibrary: "Volver a los juegos",
    },
    facts: {
      timed: "30, 60 o 120 segundos",
      reaction: "10 intentos",
      mouseTouch: "Ratón o táctil",
      desktopMouse: "Ratón de escritorio",
      difficulties: "Principiante · Intermedio · Avanzado",
    },
  },
  de: {
    openApp: "Trainer öffnen",
    home: {
      title: "AimForge — Kostenloser Aim-Trainer in 2D & 3D",
      description:
        "Übe Flicks, Präzision, Tracking und Reaktion mit 10 kostenlosen Browser-Spielen. Lokaler Fortschritt, eigene Routinen und Offline-Training. Ohne Konto.",
      heading: "Ein Ort für konzentriertes Zieltraining.",
      intro:
        "AimForge ist ein kostenloser Aim-Trainer im Browser mit zehn Spielen in 2D und 3D. Wähle eine Fähigkeit, passe die Schwierigkeit an und werte deine Übung aus. Dein Verlauf bleibt in diesem Browser, ohne Konto oder Cloud-Synchronisierung.",
      features: [
        {
          title: "Zehn Übungen zur Auswahl",
          body: "Wechsle zwischen gezielten Klicks, kleinen Zielen, kontinuierlichem Tracking und einem Reaktionstest mit zehn Versuchen. Jede Übung erklärt Steuerung und Wertung vor dem Start.",
        },
        {
          title: "Nachvollziehbare Ergebnisse",
          body: "Sieh dir Genauigkeit, aktive Trainingszeit und vergleichbare Bestleistungen an. Maus und Touch werden getrennt erfasst; unterbrochene Runden bleiben Übungsläufe.",
        },
        {
          title: "Dein eigener Rhythmus",
          body: "Erstelle Routinen, spiele tägliche Herausforderungen mit festem Startwert und exportiere deinen Fortschritt. Bereite beide Engines in den Einstellungen für die Offline-Nutzung vor.",
        },
      ],
    },
    training: {
      title: "10 kostenlose Aim-Training-Spiele in 2D & 3D | AimForge",
      description:
        "Entdecke zehn Browser-Spiele für Flicks, Präzision, Tracking, Reaktion und Zielwechsel. Mit Anleitungen, Spielbildern und verständlichen Wertungsregeln.",
      heading: "Finde die Übung für deine nächste Runde.",
      intro:
        "Jedes Spiel bietet ein eigenes Bewegungsmuster und klare Wertungsregeln. Beginne mit einer 2D-Übung per Maus oder Touch oder nutze eine Desktop-Maus für die 3D-Arena. Die Anleitungen zeigen echte Spielbilder, Steuerung und praktische Tipps.",
    },
    help: {
      title: "AimForge: Hilfe, Steuerung & Datenschutz",
      description:
        "Alles zu Steuerung, Punkten, Browser-Anforderungen, lokalen Daten, Backups und Offline-Nutzung in AimForge. So funktionieren Bestleistungen und Serien.",
      heading: "Verstehe dein Training. Behalte deine Daten.",
      intro:
        "Hier erfährst du, wie AimForge läuft, Runden auswertet und deinen Fortschritt speichert. Trainingsdaten bleiben lokal und sind keine verifizierten Wettkampfranglisten.",
    },
    labels: {
      play: "Spiel starten",
      setup: "Runde einstellen",
      gameplay: "Spielvorschau",
      screenshots: "Spielbilder",
      relatedGames: "Verwandte Übungen",
      language: "Sprache",
      howTo: "So wird gespielt",
      tips: "Übungstipps",
      controls: "Steuerung",
      scoring: "So funktioniert die Wertung",
      requirements: "Geräteanforderungen",
      faq: "Häufige Fragen",
      quickFacts: "Auf einen Blick",
      dimension: "Dimension",
      skill: "Schwerpunkt",
      duration: "Rundenlänge",
      devices: "Eingabe",
      difficulty: "Schwierigkeit",
      allGames: "Alle Spiele entdecken",
      backToLibrary: "Zurück zu den Übungen",
    },
    facts: {
      timed: "30, 60 oder 120 Sekunden",
      reaction: "10 Versuche",
      mouseTouch: "Maus oder Touch",
      desktopMouse: "Desktop-Maus",
      difficulties: "Anfänger · Fortgeschritten · Anspruchsvoll",
    },
  },
  ru: {
    openApp: "Открыть тренажёр",
    home: {
      title: "AimForge — Бесплатный тренажёр прицеливания в 2D и 3D",
      description:
        "Тренируйте переводы, точность, сопровождение и реакцию в 10 бесплатных браузерных играх. Локальный прогресс, свои программы и офлайн-режим. Без аккаунта.",
      heading: "Место для вдумчивой тренировки прицела.",
      intro:
        "AimForge — бесплатный браузерный тренажёр с десятью играми в 2D и 3D. Выберите навык, настройте сложность и изучите свои результаты. История тренировок остаётся в этом браузере, без аккаунта и облачной синхронизации.",
      features: [
        {
          title: "Десять вариантов практики",
          body: "Чередуйте точные клики, маленькие цели, непрерывное сопровождение и тест реакции из десяти попыток. Управление и подсчёт очков описаны для каждой игры.",
        },
        {
          title: "Понятные результаты",
          body: "Отслеживайте точность, активное время и сопоставимые личные рекорды. Результаты мыши и сенсорного ввода разделены, а прерванные раунды остаются практикой.",
        },
        {
          title: "Свой ритм тренировок",
          body: "Составляйте программы, проходите ежедневные испытания и экспортируйте прогресс. Подготовьте оба движка в настройках: после успешной загрузки приложение работает офлайн.",
        },
      ],
    },
    training: {
      title: "10 бесплатных игр для тренировки прицела | AimForge",
      description:
        "Выберите браузерную игру для переводов, точности, сопровождения, реакции или смены целей. Руководства, скриншоты и правила десяти игр в 2D и 3D.",
      heading: "Выберите упражнение для следующего раунда.",
      intro:
        "У каждой игры свой характер движения и понятные правила подсчёта очков. Начните с 2D на мыши или сенсорном экране либо используйте мышь для арены 3D. В руководствах есть реальные кадры игры, управление и практические советы.",
    },
    help: {
      title: "AimForge — Помощь, управление и конфиденциальность",
      description:
        "Управление, очки, требования к браузеру, локальные данные, резервные копии и офлайн в AimForge. Узнайте, как считаются личные рекорды и серии тренировок.",
      heading: "Понимайте тренировку. Управляйте данными.",
      intro:
        "Здесь описано, как AimForge работает, измеряет результаты и сохраняет прогресс. Записи хранятся локально и не являются проверенным соревновательным рейтингом.",
    },
    labels: {
      play: "Играть",
      setup: "Настроить раунд",
      gameplay: "Игра в действии",
      screenshots: "Скриншоты игры",
      relatedGames: "Похожие упражнения",
      language: "Язык",
      howTo: "Как играть",
      tips: "Советы для практики",
      controls: "Управление",
      scoring: "Подсчёт очков",
      requirements: "Требования к устройству",
      faq: "Частые вопросы",
      quickFacts: "Кратко об игре",
      dimension: "Измерение",
      skill: "Навык",
      duration: "Длительность",
      devices: "Ввод",
      difficulty: "Сложность",
      allGames: "Все игры",
      backToLibrary: "К списку упражнений",
    },
    facts: {
      timed: "30, 60 или 120 секунд",
      reaction: "10 попыток",
      mouseTouch: "Мышь или сенсорный ввод",
      desktopMouse: "Компьютерная мышь",
      difficulties: "Начальный · Средний · Продвинутый",
    },
  },
  uz: {
    openApp: "Trenajyorni ochish",
    home: {
      title: "AimForge — Bepul 2D va 3D nishonga olish trenajyori",
      description:
        "Brauzerdagi 10 bepul o‘yinda nishonga olish, aniqlik, kuzatish va reaksiyani mashq qiling. Mahalliy natijalar, mashq dasturlari va oflayn rejim. Hisobsiz.",
      heading: "Nishonga olishni mashq qilish uchun qulay joy.",
      intro:
        "AimForge — brauzerda ishlaydigan, o‘nta 2D va 3D o‘yindan iborat bepul trenajyor. Ko‘nikmani tanlang, qiyinlikni sozlang va mashq natijalaringizni ko‘ring. Tarix shu brauzerda saqlanadi: hisob va bulutli sinxronlash kerak emas.",
      features: [
        {
          title: "Mashq qilishning o‘nta usuli",
          body: "Aniq bosishlar, kichik nishonlar, uzluksiz kuzatish va o‘nta urinishli reaksiya sinovini almashtirib mashq qiling. Har bir o‘yinning boshqaruvi va ball hisoblash qoidalari ko‘rsatilgan.",
        },
        {
          title: "Tushunarli natijalar",
          body: "Aniqlik, faol mashq vaqti va mos shaxsiy rekordlarni ko‘ring. Sichqoncha va sensor natijalari alohida saqlanadi; to‘xtatilgan raundlar amaliy mashq bo‘lib qoladi.",
        },
        {
          title: "O‘zingizga mos tartib",
          body: "Mashq dasturi tuzing, kundalik sinovlarni bajaring va natijalarni eksport qiling. Sozlamalarda ikkala dvigatelni tayyorlang: yuklash tugagach, ilovadan oflayn foydalanish mumkin.",
        },
      ],
    },
    training: {
      title: "Nishonga olish uchun 10 bepul 2D va 3D o‘yin | AimForge",
      description:
        "Aniqlik, tez nishonga olish, kuzatish, reaksiya va nishon almashtirish uchun o‘nta brauzer o‘yini. Qo‘llanmalar, o‘yin rasmlari va boshqaruv qoidalari.",
      heading: "Keyingi raund uchun mos mashqni tanlang.",
      intro:
        "Har bir o‘yinning o‘ziga xos harakati va aniq ball qoidasi bor. Sichqoncha yoki sensor bilan 2D mashqdan boshlang, 3D maydon uchun esa kompyuter sichqonchasidan foydalaning. Qo‘llanmalarda haqiqiy o‘yin tasvirlari, boshqaruv va amaliy maslahatlar bor.",
    },
    help: {
      title: "AimForge — Yordam, boshqaruv va maxfiylik",
      description:
        "AimForge boshqaruvi, ballari, brauzer talablari, mahalliy ma’lumotlar, zaxira va oflayn rejim. Shaxsiy rekordlar va mashq seriyalari qanday ishlashini biling.",
      heading: "Mashqni tushuning. Ma’lumotni boshqaring.",
      intro:
        "AimForge qanday ishlashi, raundlarni o‘lchashi va natijalarni saqlashi haqida qo‘llanma. Mashq yozuvlari mahalliy saqlanadi va tasdiqlangan musobaqa reytingi hisoblanmaydi.",
    },
    labels: {
      play: "O‘ynash",
      setup: "Raundni sozlash",
      gameplay: "O‘yindan namuna",
      screenshots: "O‘yin rasmlari",
      relatedGames: "O‘xshash mashqlar",
      language: "Til",
      howTo: "Qanday o‘ynaladi",
      tips: "Mashq bo‘yicha maslahatlar",
      controls: "Boshqaruv",
      scoring: "Ball qanday hisoblanadi",
      requirements: "Qurilma talablari",
      faq: "Ko‘p so‘raladigan savollar",
      quickFacts: "Qisqacha ma’lumot",
      dimension: "O‘lcham",
      skill: "Ko‘nikma",
      duration: "Raund davomiyligi",
      devices: "Kiritish turi",
      difficulty: "Qiyinlik",
      allGames: "Barcha o‘yinlar",
      backToLibrary: "Mashqlar ro‘yxatiga qaytish",
    },
    facts: {
      timed: "30, 60 yoki 120 soniya",
      reaction: "10 ta urinish",
      mouseTouch: "Sichqoncha yoki sensor",
      desktopMouse: "Kompyuter sichqonchasi",
      difficulties: "Boshlang‘ich · O‘rta · Ilg‘or",
    },
  },
};

export function getSeoCopy(locale: Locale): SeoCopy {
  const copy = publicCopy[locale];
  return {
    nav: {
      home: t(locale, "Overview"),
      training: t(locale, "Training library"),
      help: t(locale, "Help & privacy"),
      openApp: copy.openApp,
    },
    home: copy.home,
    training: copy.training,
    help: {
      ...copy.help,
      sections: helpTopics.map((id) => ({
        id,
        title: t(locale, `help-${id}`),
        body: t(locale, `help-${id}Body`),
      })),
    },
    labels: copy.labels,
    facts: copy.facts,
    skills: {
      flicking: t(locale, "flicking"),
      precision: t(locale, "precision"),
      tracking: t(locale, "tracking"),
      reaction: t(locale, "reaction"),
      switching: t(locale, "switching"),
    },
  };
}

type GameDetail = {
  /** Specific context, objective, practice advice and an actual mechanic FAQ. */
  context: string;
  objective: string;
  tip: string;
  question: string;
  answer: string;
};
const gameDetails: Record<Locale, Record<ScenarioId, GameDetail>> = {
  en: {
    "flick-burst": {
      context:
        "Several stationary circles share the arena, so you decide the order of your shots. A hit replaces that target, while an expired target breaks the current combo. The exercise combines broad pointer transfers with a controlled final correction.",
      objective:
        "Move to one circle, make a deliberate click or tap, then choose the next visible target. Keep working through replacements until the timer ends.",
      tip: "Look toward your next target before moving. Begin with a repeatable pace and check whether misses increase when you speed up.",
      question: "Does every target have to be hit in a fixed order?",
      answer:
        "No. You may hit any visible circle. Targets expire if left too long, and an expiration resets the hit combo, so avoid repeatedly overlooking one part of the arena.",
    },
    "micro-precision": {
      context:
        "A single small circle makes the final part of each movement matter. New targets usually appear near the previous location, within the arena, creating short corrections instead of repeated sweeping flicks. Difficulty changes the target size.",
      objective:
        "Find the small circle, settle the pointer over it and click or tap once. Reacquire the replacement target and repeat through the timed round.",
      tip: "Slow down enough to distinguish an overshoot from an early click. Use center error alongside accuracy to see how closely your hits land to the center.",
      question: "Do hits near the center earn extra points?",
      answer:
        "No. Every valid hit has the same click score. Center error is recorded separately in target-radius units, so it adds context without changing the points.",
    },
    "moving-clicks": {
      context:
        "One circle follows a continuous curved path across the 2D arena. Each successful click replaces it. This drill asks you to time a discrete shot while the target is moving, rather than hold fire for tracking credit.",
      objective:
        "Watch the moving circle, bring the pointer onto it and click or tap while the two overlap. Follow each replacement and continue taking separate shots.",
      tip: "Keep your eyes on the target’s present position. If you repeatedly click behind it, reduce the pace and compare your timing with the new path.",
      question: "Is this a tracking game where I hold the button?",
      answer:
        "No. Moving Clicks scores separate clicks or taps. Smooth Tracking is the 2D drill for holding the primary button while following a moving target.",
    },
    "smooth-tracking": {
      context:
        "A circle moves continuously along a curved path. Credit accumulates only while the primary button is held and the pointer overlaps the target. The full active exposure remains in the denominator when you release the button or lose the target.",
      objective:
        "Hold the primary button, or keep a touch contact down, and follow the circle continuously. Recover smoothly when you drift away from its path.",
      tip: "Aim for an even movement rather than repeated sharp corrections. Review both tracking percentage and the longest continuous tracking segment.",
      question: "Can I improve the percentage by releasing between hits?",
      answer:
        "No. All active target exposure counts, including time with the button released. Only overlap while firing adds time on target.",
    },
    "reaction-tap": {
      context:
        "Ten trials alternate an unpredictable wait with a visible cue. Responding before the cue records a false start; failing to respond within 1.5 seconds records a timeout. The result distinguishes valid response times from these errors.",
      objective:
        "Wait while the arena says to wait. Click or tap inside the arena only after the cue appears, then wait for the next trial until all ten are complete.",
      tip: "React to the visible change instead of guessing the delay. Compare medians on the same device because display, browser and input hardware affect the measurement.",
      question: "Is this a laboratory measurement of reaction speed?",
      answer:
        "No. It measures the browser-observed interval from the displayed cue to input. Screen refresh, device latency and browser scheduling contribute to that interval.",
    },
    "sphere-flick": {
      context:
        "Stationary spheres are placed in a first-person 3D arena. You rotate the camera while the crosshair stays at the center of the view. Each hit replaces one sphere, creating repeated angular transfers between visible targets.",
      objective:
        "Start to capture the pointer. Turn the camera until the crosshair rests on a sphere, click once, then transfer to another visible sphere.",
      tip: "Use sensitivity that allows a controlled stop on the sphere. Keep field of view and difficulty consistent when comparing your own results.",
      question: "Does moving the mouse move the crosshair across the screen?",
      answer:
        "The crosshair remains centered while mouse movement rotates the 3D camera. A shot follows the center ray and only hits a sphere if no closer arena surface blocks it.",
    },
    "precision-range": {
      context:
        "Small spheres appear at different distances in the first-person arena. Their apparent size changes with distance, making careful camera corrections useful. This drill emphasizes selecting and settling onto a small visible target.",
      objective:
        "Capture the pointer, locate the sphere and turn the camera carefully until the center crosshair covers it. Click once, then inspect the replacement’s distance.",
      tip: "Allow more time for a small distant target instead of repeating missed shots. Center error and acquisition time help explain the result beyond the total score.",
      question: "Why do the spheres look different in size?",
      answer:
        "Targets are spawned at varying distances. Perspective makes a farther sphere occupy less of the screen even when its world-space radius stays the same.",
    },
    "strafe-tracking": {
      context:
        "A sphere moves smoothly from side to side, with a small vertical component. Rotate the camera to keep the center crosshair on it while holding fire. The predictable transitions let you focus on continuous mouse control.",
      objective:
        "Capture the pointer, hold the primary mouse button and follow the sphere with the camera. Stay on it as the lateral movement slows, reverses and accelerates.",
      tip: "Watch for the turnaround rather than committing to one direction for too long. Reacquire calmly after losing contact instead of making several large corrections.",
      question: "Do I move a player sideways in this drill?",
      answer:
        "No. The target performs the lateral movement. Your viewpoint stays in place and your mouse turns the camera to follow it.",
    },
    "reactive-tracking": {
      context:
        "The moving sphere changes its intended direction and speed at seeded intervals, with smooth acceleration between changes. Its vertical motion also varies. Continuous contact requires responding to what it does rather than memorizing a simple left-right rhythm.",
      objective:
        "Capture the pointer and hold fire while following the sphere. When its speed or direction changes, adjust the camera to regain overlap with the center crosshair.",
      tip: "Use smaller corrections after a reversal and avoid predicting every change. Compare this with Strafe Tracking to separate smooth following from direction-change recovery.",
      question: "Does the target teleport when it changes direction?",
      answer:
        "No. Its velocity transitions smoothly toward a new value. The path remains continuous even when the direction and speed become less predictable.",
    },
    "target-switching": {
      context:
        "Several spheres share the arena and each needs three separate hits before it is replaced. You balance finishing the current sphere with the next camera transfer. The results include completed targets and recorded completion intervals.",
      objective:
        "Capture the pointer, aim at a sphere and land three separate clicks. Once it is completed, transfer the crosshair to another sphere and repeat.",
      tip: "Keep your aim steady for all three hits before moving away. A fast transfer loses its value if the previous sphere still needs a finishing click.",
      question: "Will holding the mouse button finish a sphere automatically?",
      answer:
        "No. This is a click drill. Each sphere requires three separate hits; holding the button is the control used in tracking scenarios, not automatic fire here.",
    },
  },
  es: {
    "flick-burst": {
      context:
        "Varios círculos estáticos comparten la arena y tú eliges el orden de los disparos. Cada acierto sustituye un objetivo; si uno caduca, se rompe la racha de aciertos. El ejercicio combina desplazamientos amplios con una corrección final controlada.",
      objective:
        "Apunta a un círculo, haz un clic o toque deliberado y elige el siguiente. Continúa con los objetivos nuevos hasta que termine el tiempo.",
      tip: "Mira el próximo objetivo antes de mover el puntero. Empieza a un ritmo repetible y observa si aumentan los fallos al acelerar.",
      question: "¿Hay que acertar los objetivos en un orden fijo?",
      answer:
        "No. Puedes acertar cualquier círculo visible. Los objetivos caducan si esperas demasiado y eso reinicia la racha, así que evita ignorar una zona de la arena.",
    },
    "micro-precision": {
      context:
        "Un único círculo pequeño exige controlar el final del movimiento. El siguiente suele aparecer cerca del anterior, dentro de la arena, para practicar correcciones cortas. La dificultad cambia el tamaño del objetivo.",
      objective:
        "Localiza el círculo pequeño, estabiliza el puntero encima y haz un clic o toque. Encuentra el siguiente objetivo y repite durante la ronda.",
      tip: "Baja el ritmo para distinguir un movimiento excesivo de un clic prematuro. Consulta el error respecto al centro junto con la precisión.",
      question: "¿Acertar cerca del centro da más puntos?",
      answer:
        "No. Todos los aciertos válidos tienen la misma puntuación. El error respecto al centro se registra por separado en unidades del radio del objetivo.",
    },
    "moving-clicks": {
      context:
        "Un círculo sigue una trayectoria curva y continua por la arena 2D. Cada acierto lo sustituye. Debes elegir el instante de un disparo individual mientras se mueve, en lugar de mantener el botón para sumar seguimiento.",
      objective:
        "Observa el círculo, coloca el puntero encima y haz clic o toca mientras coinciden. Sigue los objetivos nuevos y realiza disparos separados.",
      tip: "Mira la posición actual del objetivo. Si haces clic repetidamente por detrás, reduce el ritmo y observa cómo cambia tu sincronización.",
      question: "¿Debo mantener pulsado como en un juego de seguimiento?",
      answer:
        "No. Clics en movimiento puntúa clics o toques separados. Seguimiento suave es el ejercicio 2D para mantener pulsado mientras sigues al objetivo.",
    },
    "smooth-tracking": {
      context:
        "Un círculo recorre una trayectoria curva de forma continua. Solo acumulas tiempo sobre el objetivo mientras mantienes pulsado y el puntero coincide con él. Soltar el botón o perderlo no reduce el tiempo total evaluado.",
      objective:
        "Mantén pulsado el botón principal o conserva el contacto táctil y sigue el círculo. Recupera el contacto con suavidad cuando te salgas de su trayectoria.",
      tip: "Busca un movimiento uniforme en vez de correcciones bruscas repetidas. Revisa el porcentaje de seguimiento y el tramo continuo más largo.",
      question:
        "¿Puedo mejorar el porcentaje soltando el botón entre aciertos?",
      answer:
        "No. Se evalúa todo el tiempo activo de exposición, incluso cuando sueltas. Solo la coincidencia con el objetivo mientras disparas suma tiempo sobre él.",
    },
    "reaction-tap": {
      context:
        "Diez intentos alternan una espera impredecible con una señal visual. Pulsar antes cuenta como salida falsa; no responder en 1,5 segundos cuenta como tiempo agotado. El resultado separa las respuestas válidas de estos errores.",
      objective:
        "Espera mientras la arena lo indica. Haz clic o toca dentro solo cuando aparezca la señal y espera al siguiente intento hasta completar diez.",
      tip: "Responde al cambio visible sin adivinar la espera. Compara medianas en el mismo dispositivo, porque pantalla, navegador y entrada afectan a la medición.",
      question: "¿Es una medición de reacción de laboratorio?",
      answer:
        "No. Mide el intervalo observado por el navegador entre la señal y la entrada. La frecuencia de pantalla, la latencia del dispositivo y el navegador influyen.",
    },
    "sphere-flick": {
      context:
        "Varias esferas estáticas aparecen en una arena 3D en primera persona. Giras la cámara mientras la mira permanece en el centro. Cada acierto sustituye una esfera y genera nuevos cambios de dirección.",
      objective:
        "Inicia para capturar el puntero. Gira la cámara hasta colocar la mira en una esfera, haz clic una vez y pasa a otra esfera visible.",
      tip: "Elige una sensibilidad que permita detenerte con control. Mantén iguales el campo de visión y la dificultad al comparar tus resultados.",
      question: "¿La mira se desplaza por la pantalla al mover el ratón?",
      answer:
        "La mira permanece centrada y el ratón gira la cámara 3D. El disparo sigue el rayo central y solo alcanza una esfera si no hay una superficie más cercana delante.",
    },
    "precision-range": {
      context:
        "Aparecen esferas pequeñas a distintas distancias. Su tamaño aparente cambia con la perspectiva, por lo que conviene corregir la cámara con cuidado. El ejercicio se centra en localizar y apuntar a un objetivo pequeño.",
      objective:
        "Captura el puntero, localiza la esfera y gira la cámara hasta cubrirla con la mira central. Haz clic una vez y observa la distancia del nuevo objetivo.",
      tip: "Dedica más tiempo a un objetivo pequeño y lejano en lugar de fallar varias veces. El error central y el tiempo de adquisición ayudan a interpretar el resultado.",
      question: "¿Por qué las esferas parecen tener tamaños distintos?",
      answer:
        "Aparecen a distancias diferentes. La perspectiva hace que una esfera lejana ocupe menos pantalla aunque su radio en el mundo sea el mismo.",
    },
    "strafe-tracking": {
      context:
        "Una esfera se mueve suavemente de lado a lado con un pequeño componente vertical. Gira la cámara para mantener la mira sobre ella mientras disparas. Las transiciones previsibles permiten centrarse en el control continuo.",
      objective:
        "Captura el puntero, mantén el botón principal y sigue la esfera con la cámara. Acompáñala cuando frene, cambie de sentido y acelere.",
      tip: "Observa el cambio de sentido en vez de mantener demasiado tiempo la dirección anterior. Recupera el contacto con calma si pierdes el objetivo.",
      question: "¿Tengo que desplazar a un jugador lateralmente?",
      answer:
        "No. El objetivo hace el movimiento lateral. Tu punto de vista permanece fijo y el ratón gira la cámara para seguirlo.",
    },
    "reactive-tracking": {
      context:
        "La esfera cambia su dirección y velocidad deseadas a intervalos determinados por una semilla, con aceleración suave. También varía la altura. Mantener el contacto exige responder a su movimiento sin memorizar un ritmo lateral simple.",
      objective:
        "Captura el puntero y mantén el disparo al seguir la esfera. Ajusta la cámara tras cada cambio de velocidad o dirección para recuperar la coincidencia.",
      tip: "Haz correcciones pequeñas tras un cambio de sentido. Compara con Seguimiento lateral para distinguir el seguimiento suave de la recuperación ante cambios.",
      question: "¿El objetivo se teletransporta al cambiar de dirección?",
      answer:
        "No. La velocidad se aproxima suavemente a un nuevo valor. La trayectoria sigue siendo continua aunque la dirección y la velocidad sean menos previsibles.",
    },
    "target-switching": {
      context:
        "Varias esferas comparten la arena y cada una requiere tres aciertos separados antes de ser sustituida. Debes terminar la esfera actual y preparar el siguiente giro. Los resultados incluyen objetivos completados e intervalos de finalización.",
      objective:
        "Captura el puntero, apunta a una esfera y acierta tres clics separados. Cuando se complete, pasa la mira a otra y repite.",
      tip: "Mantén la mira estable durante los tres aciertos antes de cambiar. Un giro rápido sirve de poco si aún falta terminar la esfera anterior.",
      question: "¿Mantener pulsado elimina una esfera automáticamente?",
      answer:
        "No. Es un ejercicio de clics: cada esfera exige tres aciertos separados. Mantener pulsado se usa en los escenarios de seguimiento, no como disparo automático aquí.",
    },
  },
  de: {
    "flick-burst": {
      context:
        "Mehrere stehende Kreise teilen sich die Arena. Du bestimmst die Reihenfolge der Schüsse. Ein Treffer ersetzt das Ziel; läuft ein Ziel ab, endet die Trefferkombination. Die Übung verbindet größere Mausbewegungen mit einer kontrollierten letzten Korrektur.",
      objective:
        "Bewege den Zeiger zu einem Kreis, klicke oder tippe bewusst und wähle das nächste Ziel. Bearbeite neue Ziele, bis die Zeit abläuft.",
      tip: "Schau vor der Bewegung zum nächsten Ziel. Beginne mit einem gleichmäßigen Tempo und beobachte, ob schnelleres Spielen mehr Fehlschüsse verursacht.",
      question: "Muss ich die Ziele in einer festen Reihenfolge treffen?",
      answer:
        "Nein. Jeder sichtbare Kreis kann getroffen werden. Ziele laufen nach einer gewissen Zeit ab und setzen dabei die Trefferkombination zurück. Vernachlässige daher keinen Bereich der Arena.",
    },
    "micro-precision": {
      context:
        "Ein einzelner kleiner Kreis macht das Ende jeder Bewegung entscheidend. Neue Ziele erscheinen meist nahe der vorherigen Position innerhalb der Arena. So entstehen kurze Korrekturen statt großer Schwenks. Die Schwierigkeit verändert die Zielgröße.",
      objective:
        "Finde den kleinen Kreis, halte den Zeiger darüber an und klicke oder tippe einmal. Erfasse das neue Ziel und wiederhole dies während der Runde.",
      tip: "Verlangsame das Tempo, um Überschwingen von zu frühem Klicken zu unterscheiden. Der Mittelpunktfehler ergänzt die Trefferquote um die Lage deiner Treffer.",
      question: "Geben Treffer nahe der Mitte mehr Punkte?",
      answer:
        "Nein. Jeder gültige Treffer zählt gleich viel. Der Mittelpunktfehler wird getrennt in Einheiten des Zielradius erfasst und verändert die Punktzahl nicht.",
    },
    "moving-clicks": {
      context:
        "Ein Kreis folgt einer fortlaufenden gekrümmten Bahn durch die 2D-Arena. Jeder Treffer ersetzt ihn. Du setzt einzelne Schüsse auf ein bewegtes Ziel, statt die Feuertaste für Tracking-Punkte gedrückt zu halten.",
      objective:
        "Beobachte den Kreis und klicke oder tippe, wenn Zeiger und Ziel übereinanderliegen. Folge jedem neuen Ziel mit weiteren einzelnen Schüssen.",
      tip: "Achte auf die aktuelle Zielposition. Wenn deine Klicks oft dahinterliegen, reduziere das Tempo und beobachte den Zusammenhang zwischen Bewegung und Klickzeitpunkt.",
      question: "Soll ich die Taste wie beim Tracking gedrückt halten?",
      answer:
        "Nein. Bewegte Ziele wertet einzelne Klicks oder Berührungen. Sanftes Tracking ist die 2D-Übung zum Folgen mit gedrückter Haupttaste.",
    },
    "smooth-tracking": {
      context:
        "Ein Kreis bewegt sich fortlaufend auf einer gekrümmten Bahn. Zielzeit zählt nur, wenn die Haupttaste gedrückt ist und der Zeiger das Ziel überlappt. Auch beim Loslassen oder Verfehlen bleibt die gesamte aktive Zeit Teil der Wertung.",
      objective:
        "Halte die Haupttaste oder einen Touch-Kontakt gedrückt und folge dem Kreis. Kehre mit einer ruhigen Bewegung zurück, wenn du seine Bahn verlässt.",
      tip: "Strebe gleichmäßige Bewegungen statt vieler ruckartiger Korrekturen an. Vergleiche Tracking-Prozent und die längste zusammenhängende Zielzeit.",
      question: "Steigt mein Prozentwert, wenn ich zwischendurch loslasse?",
      answer:
        "Nein. Die gesamte aktive Zielzeit zählt zum Nenner, auch ohne gedrückte Taste. Nur die Überlappung während des Feuerns erhöht die Zeit auf dem Ziel.",
    },
    "reaction-tap": {
      context:
        "Zehn Versuche wechseln zwischen einer unvorhersehbaren Wartezeit und einem sichtbaren Signal. Ein Klick davor ist ein Fehlstart; ohne Antwort innerhalb von 1,5 Sekunden zählt der Versuch als verpasst. Gültige Reaktionszeiten werden getrennt erfasst.",
      objective:
        "Warte auf das Signal. Klicke oder tippe erst danach innerhalb der Arena und warte auf den nächsten Versuch, bis alle zehn abgeschlossen sind.",
      tip: "Reagiere auf die sichtbare Änderung, statt den Zeitpunkt zu erraten. Vergleiche Mediane auf demselben Gerät, da Bildschirm, Browser und Eingabe die Messung beeinflussen.",
      question: "Ist das eine Reaktionsmessung unter Laborbedingungen?",
      answer:
        "Nein. Gemessen wird die im Browser beobachtete Zeit vom Signal bis zur Eingabe. Bildwiederholrate, Gerätelatenz und Browser-Verarbeitung gehen in diesen Wert ein.",
    },
    "sphere-flick": {
      context:
        "Stehende Kugeln befinden sich in einer 3D-Arena aus der Ich-Perspektive. Du drehst die Kamera, während das Fadenkreuz in der Bildmitte bleibt. Jeder Treffer ersetzt eine Kugel und verlangt einen neuen gezielten Kameraschwenk.",
      objective:
        "Starte die Zeigererfassung. Drehe die Kamera auf eine Kugel, klicke einmal und wechsle zu einer weiteren sichtbaren Kugel.",
      tip: "Wähle eine Empfindlichkeit, mit der du kontrolliert auf dem Ziel anhalten kannst. Halte Sichtfeld und Schwierigkeit für Ergebnisvergleiche gleich.",
      question:
        "Wandert das Fadenkreuz bei Mausbewegungen über den Bildschirm?",
      answer:
        "Das Fadenkreuz bleibt zentriert; die Maus dreht die Kamera. Ein Schuss folgt dem mittleren Strahl und trifft nur, wenn keine nähere Arenafläche die Kugel verdeckt.",
    },
    "precision-range": {
      context:
        "Kleine Kugeln erscheinen in unterschiedlichen Entfernungen. Ihre sichtbare Größe verändert sich mit der Perspektive, weshalb sorgfältige Kamerakorrekturen wichtig sind. Die Übung konzentriert sich auf das Erfassen kleiner Ziele.",
      objective:
        "Erfasse den Zeiger, finde die Kugel und drehe die Kamera vorsichtig darauf. Klicke einmal und beachte anschließend die Entfernung des neuen Ziels.",
      tip: "Nimm dir für ein kleines fernes Ziel Zeit, statt mehrere Fehlschüsse abzugeben. Mittelpunktfehler und Erfassungszeit erklären mehr als die Punktzahl allein.",
      question: "Warum sehen die Kugeln unterschiedlich groß aus?",
      answer:
        "Sie erscheinen in verschiedenen Entfernungen. Eine weiter entfernte Kugel nimmt durch die Perspektive weniger Bildschirmfläche ein, auch bei gleichem Radius im Raum.",
    },
    "strafe-tracking": {
      context:
        "Eine Kugel bewegt sich gleichmäßig seitwärts und leicht auf und ab. Drehe die Kamera, um das mittlere Fadenkreuz beim Feuern auf ihr zu halten. Die vorhersehbaren Übergänge eignen sich für kontinuierliche Mausbewegungen.",
      objective:
        "Erfasse den Zeiger, halte die Haupttaste gedrückt und folge der Kugel. Begleite sie beim Abbremsen, Umkehren und erneuten Beschleunigen.",
      tip: "Achte auf den Wendepunkt, statt zu lange in eine Richtung zu ziehen. Stelle nach einem Kontaktverlust ruhig nach, anstatt mehrfach stark zu korrigieren.",
      question: "Muss ich meine Spielfigur seitwärts bewegen?",
      answer:
        "Nein. Das Ziel führt die seitliche Bewegung aus. Dein Standpunkt bleibt fest; mit der Maus drehst du nur die Kamera.",
    },
    "reactive-tracking": {
      context:
        "Die Kugel verändert ihre gewünschte Richtung und Geschwindigkeit in vom Startwert bestimmten Intervallen. Die Beschleunigung bleibt weich, auch die Höhe variiert. Du reagierst auf den tatsächlichen Verlauf statt auf einen einfachen Links-rechts-Rhythmus.",
      objective:
        "Erfasse den Zeiger und halte beim Verfolgen die Feuertaste gedrückt. Passe die Kamera nach Geschwindigkeits- oder Richtungswechseln an, bis das Fadenkreuz wieder überlappt.",
      tip: "Korrigiere nach einer Umkehr mit kleinen Bewegungen. Vergleiche die Übung mit Seitlichem Tracking, um gleichmäßiges Folgen und Wiedererfassen auseinanderzuhalten.",
      question:
        "Springt das Ziel bei einem Richtungswechsel an eine andere Stelle?",
      answer:
        "Nein. Die Geschwindigkeit nähert sich einem neuen Wert sanft an. Die Bahn bleibt durchgehend, auch wenn Richtung und Tempo weniger vorhersehbar werden.",
    },
    "target-switching": {
      context:
        "Mehrere Kugeln teilen sich die Arena. Jede benötigt drei einzelne Treffer, bevor sie ersetzt wird. Du verbindest das Abschließen eines Ziels mit dem nächsten Kameraschwenk. Ergebnisse enthalten abgeschlossene Ziele und Abschlussintervalle.",
      objective:
        "Erfasse den Zeiger, ziele auf eine Kugel und triff mit drei einzelnen Klicks. Wechsle nach dem Abschluss zur nächsten Kugel.",
      tip: "Halte die Kamera für alle drei Treffer ruhig, bevor du wechselst. Ein schneller Schwenk hilft wenig, wenn auf der vorherigen Kugel noch ein Treffer fehlt.",
      question: "Erledigt eine gedrückte Maustaste die Kugel automatisch?",
      answer:
        "Nein. Diese Übung verlangt einzelne Klicks. Jede Kugel braucht drei Treffer; Gedrückthalten ist die Steuerung für Tracking-Übungen und erzeugt hier kein automatisches Feuer.",
    },
  },
  ru: {
    "flick-burst": {
      context:
        "На арене одновременно видны несколько неподвижных кругов, и вы выбираете порядок выстрелов. Попадание заменяет цель, а исчезновение просроченной цели прерывает комбо. Упражнение сочетает широкие переводы и точную последнюю доводку.",
      objective:
        "Наведитесь на круг, осознанно нажмите мышью или коснитесь его, затем выберите следующую цель. Продолжайте до конца таймера.",
      tip: "Сначала посмотрите на следующую цель, затем двигайте указатель. Начните с ровного темпа и проверьте, растёт ли число промахов при ускорении.",
      question: "Нужно ли поражать цели в определённом порядке?",
      answer:
        "Нет. Можно выбрать любой видимый круг. Если долго его игнорировать, цель исчезнет и сбросит комбо, поэтому не забывайте про отдельные части арены.",
    },
    "micro-precision": {
      context:
        "Один маленький круг делает завершающую часть движения особенно важной. Новая цель обычно появляется рядом с предыдущей в пределах арены, требуя короткой доводки вместо большого перевода. Сложность меняет размер цели.",
      objective:
        "Найдите маленький круг, остановите на нём указатель и нажмите один раз. Найдите следующую цель и повторяйте до конца раунда.",
      tip: "Замедлитесь, чтобы отличить перелёт от преждевременного клика. Сравнивайте точность с отклонением от центра: они описывают разные стороны попадания.",
      question: "За попадание ближе к центру дают больше очков?",
      answer:
        "Нет. Все засчитанные попадания дают одинаковое число очков. Отклонение от центра записывается отдельно в единицах радиуса цели и не меняет счёт.",
    },
    "moving-clicks": {
      context:
        "Один круг непрерывно движется по изогнутой траектории на 2D-арене. Каждое попадание заменяет его. Здесь важно выбрать момент отдельного выстрела по движущейся цели, а не удерживать кнопку для сопровождения.",
      objective:
        "Следите за кругом, совместите указатель с ним и нажмите в момент совпадения. Продолжайте отдельными кликами или касаниями по новым целям.",
      tip: "Смотрите на текущее положение цели. Если клики постоянно остаются позади, снизьте темп и проследите связь между движением и моментом нажатия.",
      question: "Здесь нужно удерживать кнопку, как при сопровождении?",
      answer:
        "Нет. Движущиеся цели оценивает отдельные клики или касания. Для удержания кнопки на движущейся цели предназначено Плавное сопровождение.",
    },
    "smooth-tracking": {
      context:
        "Круг непрерывно движется по изогнутой траектории. Время на цели начисляется только при удержании основной кнопки и совпадении указателя с кругом. Отпускание кнопки или потеря цели не уменьшает общее оцениваемое время.",
      objective:
        "Удерживайте основную кнопку или контакт с сенсорным экраном и следуйте за кругом. Плавно возвращайтесь на траекторию после потери цели.",
      tip: "Стремитесь к ровному движению вместо частых резких исправлений. Смотрите и на процент сопровождения, и на самый длинный непрерывный участок.",
      question: "Можно ли повысить процент, отпуская кнопку между попаданиями?",
      answer:
        "Нет. Учитывается всё активное время присутствия цели, включая время с отпущенной кнопкой. Время на цели растёт только при совпадении во время огня.",
    },
    "reaction-tap": {
      context:
        "Десять попыток чередуют непредсказуемое ожидание с видимым сигналом. Нажатие до сигнала считается фальстартом; отсутствие ответа за 1,5 секунды — пропуском. Эти ошибки учитываются отдельно от корректных времен реакции.",
      objective:
        "Ждите, пока арена просит подождать. Нажимайте внутри неё только после появления сигнала, затем ждите следующую попытку до завершения всех десяти.",
      tip: "Реагируйте на видимое изменение, не угадывайте задержку. Сравнивайте медианы на одном устройстве: экран, браузер и мышь влияют на измерение.",
      question: "Это лабораторное измерение скорости реакции?",
      answer:
        "Нет. Измеряется наблюдаемый браузером интервал от сигнала до ввода. В него входят влияние частоты экрана, задержки устройства и обработки в браузере.",
    },
    "sphere-flick": {
      context:
        "Неподвижные сферы расположены на 3D-арене от первого лица. Вы поворачиваете камеру, а прицел остаётся в центре экрана. Попадание заменяет сферу и создаёт новый перевод между видимыми целями.",
      objective:
        "Запустите раунд для захвата указателя. Поверните камеру, совместите прицел со сферой, нажмите один раз и переведитесь на другую цель.",
      tip: "Подберите чувствительность, позволяющую контролируемо остановиться на сфере. Для сравнения результатов сохраняйте одинаковые угол обзора и сложность.",
      question: "При движении мыши прицел перемещается по экрану?",
      answer:
        "Прицел остаётся в центре, а мышь поворачивает камеру. Выстрел идёт по центральному лучу и попадает в сферу, если её не перекрывает более близкая поверхность арены.",
    },
    "precision-range": {
      context:
        "Маленькие сферы появляются на разных расстояниях. Их видимый размер меняется из-за перспективы, поэтому полезны осторожные доводки камеры. Упражнение сосредоточено на поиске и точном наведении на небольшую цель.",
      objective:
        "Захватите указатель, найдите сферу и осторожно поверните камеру до совпадения с центральным прицелом. Нажмите один раз и оцените расстояние до новой цели.",
      tip: "Дайте себе больше времени на маленькую далёкую цель вместо серии промахов. Отклонение от центра и время захвата помогают понять результат помимо очков.",
      question: "Почему сферы выглядят разными по размеру?",
      answer:
        "Они появляются на разных расстояниях. Из-за перспективы дальняя сфера занимает меньше места на экране даже при одинаковом радиусе в мире.",
    },
    "strafe-tracking": {
      context:
        "Сфера плавно движется из стороны в сторону с небольшим вертикальным смещением. Поворачивайте камеру, удерживая прицел на ней во время огня. Предсказуемые развороты позволяют сосредоточиться на непрерывном контроле мыши.",
      objective:
        "Захватите указатель, удерживайте основную кнопку и следуйте камерой за сферой. Сопровождайте её при замедлении, развороте и ускорении.",
      tip: "Следите за моментом разворота, не продолжайте прежнее движение слишком долго. После потери контакта возвращайтесь спокойно, без нескольких больших доводок.",
      question: "В этом упражнении нужно двигать персонажа вбок?",
      answer:
        "Нет. Вбок движется сама цель. Ваша точка обзора остаётся на месте, а мышь только поворачивает камеру.",
    },
    "reactive-tracking": {
      context:
        "Сфера меняет желаемые направление и скорость через интервалы, заданные начальным числом генератора, и плавно ускоряется. Меняется и её высота. Для удержания контакта нужно реагировать на движение, а не запоминать простой боковой ритм.",
      objective:
        "Захватите указатель и удерживайте огонь, следуя за сферой. После смены скорости или направления скорректируйте камеру до возвращения прицела на цель.",
      tip: "После разворота используйте небольшие доводки. Сравните с Боковым сопровождением, чтобы отделить плавное следование от восстановления после смены направления.",
      question: "Цель телепортируется при смене направления?",
      answer:
        "Нет. Её скорость плавно приближается к новому значению. Траектория остаётся непрерывной, хотя направление и темп становятся менее предсказуемыми.",
    },
    "target-switching": {
      context:
        "На арене несколько сфер, и каждая требует трёх отдельных попаданий до замены. Нужно завершить текущую цель и подготовить следующий перевод камеры. В результатах есть число завершённых целей и интервалы между завершениями.",
      objective:
        "Захватите указатель, наведитесь на сферу и попадите тремя отдельными кликами. После завершения переведите прицел на другую сферу.",
      tip: "Сохраняйте наведение на все три попадания, прежде чем уходить с цели. Быстрый перевод мало помогает, если предыдущую сферу ещё нужно добить.",
      question: "Удержание кнопки автоматически завершит сферу?",
      answer:
        "Нет. Это упражнение с отдельными кликами. На каждую сферу нужны три попадания; удержание используется в сопровождении и не включает здесь автоматический огонь.",
    },
  },
  uz: {
    "flick-burst": {
      context:
        "Maydonda bir nechta harakatsiz doira bo‘ladi; ularni urish tartibini o‘zingiz tanlaysiz. Tegish yangi nishon chiqaradi, muddati tugagan nishon esa kombo seriyasini uzadi. Mashq katta harakatdan keyin kichik, boshqariladigan tuzatishni talab qiladi.",
      objective:
        "Ko‘rsatkichni doiraga olib boring, ongli ravishda bosing yoki teging va keyingi nishonni tanlang. Vaqt tugaguncha yangi nishonlarni urishda davom eting.",
      tip: "Harakatdan oldin keyingi nishonga qarang. Bir xil tempdan boshlang va tezlashganda xatolar ko‘payishini kuzating.",
      question: "Nishonlarni qat’iy tartibda urish kerakmi?",
      answer:
        "Yo‘q. Istalgan ko‘rinib turgan doirani urishingiz mumkin. Uzoq qoldirilgan nishonning muddati tugab, kombo bekor bo‘ladi, shuning uchun maydonning bir qismini e’tiborsiz qoldirmang.",
    },
    "micro-precision": {
      context:
        "Bitta kichik doira harakatning oxirgi qismini muhim qiladi. Yangi nishon odatda avvalgisiga yaqin, maydon ichida paydo bo‘ladi. Bu keng burilishlar o‘rniga kichik tuzatishlarni mashq qildiradi. Qiyinlik nishon o‘lchamini o‘zgartiradi.",
      objective:
        "Kichik doirani toping, ko‘rsatkichni ustida to‘xtating va bir marta bosing yoki teging. Yangi nishonni topib, raund davomida takrorlang.",
      tip: "Ortiqcha harakatni erta bosishdan farqlash uchun sekinlashing. Aniqlik bilan birga markazdan og‘ishni ham tekshiring.",
      question: "Markazga yaqin tegish ko‘proq ball beradimi?",
      answer:
        "Yo‘q. Har bir to‘g‘ri tegish bir xil ball beradi. Markazdan og‘ish nishon radiusi birliklarida alohida saqlanadi va ballni o‘zgartirmaydi.",
    },
    "moving-clicks": {
      context:
        "Bitta doira 2D maydon bo‘ylab uzluksiz egri yo‘lda yuradi. Har bir tegish uni almashtiradi. Bu yerda tugmani ushlab kuzatish emas, harakatdagi nishonga alohida bosish vaqtini tanlash muhim.",
      objective:
        "Doirani kuzating, ko‘rsatkichni ustiga olib boring va ular ustma-ust kelganda bosing yoki teging. Yangi nishonlarni alohida bosishlar bilan uring.",
      tip: "Nishonning hozirgi joyiga qarang. Doim orqasiga bosayotgan bo‘lsangiz, tempni pasaytirib, bosish vaqtini kuzating.",
      question: "Kuzatish o‘yinidagidek tugmani bosib turish kerakmi?",
      answer:
        "Yo‘q. Harakatdagi nishonlar alohida bosish yoki tegishlarni hisoblaydi. Tugmani ushlab harakatdagi nishonni kuzatish uchun Silliq kuzatish mashqi bor.",
    },
    "smooth-tracking": {
      context:
        "Doira egri yo‘lda uzluksiz harakatlanadi. Nishondagi vaqt faqat asosiy tugma bosilgan va ko‘rsatkich doira bilan ustma-ust bo‘lganda yig‘iladi. Tugmani qo‘yib yuborish yoki nishonni yo‘qotish umumiy baholash vaqtini kamaytirmaydi.",
      objective:
        "Asosiy tugmani yoki sensor kontaktini ushlab, doirani kuzating. Yo‘ldan chiqib ketsangiz, silliq harakat bilan qayting.",
      tip: "Tez-tez keskin tuzatish o‘rniga bir tekis harakat qiling. Kuzatish foizi bilan birga eng uzun uzluksiz kuzatish qismini ham ko‘ring.",
      question: "Orada tugmani qo‘yib yuborsam, foiz oshadimi?",
      answer:
        "Yo‘q. Nishon ko‘rinib turgan barcha faol vaqt hisoblanadi, jumladan tugma qo‘yib yuborilgan vaqt ham. Faqat otish paytidagi ustma-ustlik nishondagi vaqtni oshiradi.",
    },
    "reaction-tap": {
      context:
        "O‘nta urinishda oldindan aytib bo‘lmaydigan kutishdan so‘ng ko‘rinadigan signal chiqadi. Signaldan oldin bosish erta bosish, 1,5 soniya ichida javob bermaslik esa o‘tkazib yuborish hisoblanadi. Ular to‘g‘ri reaksiya vaqtlaridan alohida saqlanadi.",
      objective:
        "Maydon kutishni ko‘rsatganda kuting. Faqat signal chiqqach, maydon ichida bosing yoki teging. O‘nta urinish tugaguncha har bir keyingi signalni kuting.",
      tip: "Kutish vaqtini taxmin qilmang, ko‘rinadigan o‘zgarishga javob bering. Medianalarni bir qurilmada solishtiring: ekran, brauzer va kiritish qurilmasi o‘lchovga ta’sir qiladi.",
      question: "Bu laboratoriyadagi reaksiya tezligi o‘lchovimi?",
      answer:
        "Yo‘q. Brauzer signal bilan kiritish orasidagi vaqtni o‘lchaydi. Ekran yangilanishi, qurilma kechikishi va brauzer ishlovi ham shu vaqtga kiradi.",
    },
    "sphere-flick": {
      context:
        "Harakatsiz sharlar birinchi shaxs 3D maydonida joylashadi. Nishon belgisi ekran markazida qoladi, siz esa kamerani burasiz. Har bir tegish sharni almashtirib, ko‘rinadigan nishonlar orasida yangi burilishni talab qiladi.",
      objective:
        "Ko‘rsatkichni ushlash uchun raundni boshlang. Kamerani burib, markaziy belgini sharga olib boring, bir marta bosing va boshqa sharga o‘ting.",
      tip: "Shar ustida boshqariladigan tarzda to‘xtashga mos sezgirlik tanlang. Natijalarni solishtirganda ko‘rish burchagi va qiyinlikni bir xil saqlang.",
      question:
        "Sichqonchani siljitsam, nishon belgisi ekran bo‘ylab yuradimi?",
      answer:
        "Belgi markazda qoladi, sichqoncha esa 3D kamerani buradi. O‘q markaziy nur bo‘ylab yo‘naladi va yaqinroq maydon sirti to‘smasa sharga tegadi.",
    },
    "precision-range": {
      context:
        "Kichik sharlar turli masofalarda paydo bo‘ladi. Perspektiva tufayli ko‘rinadigan o‘lchami o‘zgaradi, shuning uchun kamerani ehtiyotkorlik bilan tuzatish foydali. Mashq kichik nishonni topish va aniq mo‘ljallashga qaratilgan.",
      objective:
        "Ko‘rsatkichni ushlang, sharni toping va markaziy belgi ustiga kelguncha kamerani sekin buring. Bir marta bosing va yangi nishon masofasini ko‘ring.",
      tip: "Kichik uzoq nishonga ketma-ket xato qilish o‘rniga ko‘proq vaqt ajrating. Markazdan og‘ish va nishonga olish vaqti ballga qo‘shimcha izoh beradi.",
      question: "Nega sharlar turli o‘lchamda ko‘rinadi?",
      answer:
        "Ular turli masofalarda paydo bo‘ladi. Dunyo ichidagi radiusi bir xil bo‘lsa ham, perspektiva uzoqdagi sharni ekranda kichikroq ko‘rsatadi.",
    },
    "strafe-tracking": {
      context:
        "Shar silliq yonma-yon va ozgina yuqoriga-pastga harakatlanadi. Otish tugmasini ushlab, kamerani burish orqali markaziy belgini sharda saqlang. Oldindan tushunarli burilishlar uzluksiz sichqoncha nazoratiga e’tibor berishga yordam beradi.",
      objective:
        "Ko‘rsatkichni ushlang, asosiy tugmani bosib turing va kamerani shar ortidan buring. Shar sekinlashib, qayrilib, tezlashganda ham kuzating.",
      tip: "Avvalgi yo‘nalishda ortiqcha davom etmay, qayrilish nuqtasini kuzating. Kontakt yo‘qolgach, bir nechta katta tuzatish o‘rniga xotirjam qayting.",
      question: "Bu mashqda o‘yinchini yon tomonga yuritish kerakmi?",
      answer:
        "Yo‘q. Yonlama harakatni nishon bajaradi. Ko‘rish nuqtangiz joyida qoladi, sichqoncha esa faqat kamerani buradi.",
    },
    "reactive-tracking": {
      context:
        "Shar boshlang‘ich son asosida belgilangan oraliqlarda yo‘nalishi va tezligini o‘zgartirib, silliq tezlanadi. Balandligi ham o‘zgaradi. Kontaktni saqlash uchun oddiy chap-o‘ng ritmni yodlash emas, haqiqiy harakatga javob berish kerak.",
      objective:
        "Ko‘rsatkichni ushlang va sharni kuzatishda otish tugmasini bosib turing. Tezlik yoki yo‘nalish o‘zgargach, belgi yana nishonga kelguncha kamerani tuzating.",
      tip: "Qayrilishdan keyin kichik tuzatishlar qiling. Silliq kuzatish va yo‘nalish o‘zgargach qayta topishni farqlash uchun Yonlama kuzatish bilan solishtiring.",
      question: "Yo‘nalish o‘zgarganda nishon boshqa joyga sakraydimi?",
      answer:
        "Yo‘q. Tezligi yangi qiymatga silliq o‘tadi. Yo‘nalish va tempni oldindan bilish qiyinroq bo‘lsa ham, harakat yo‘li uzluksiz qoladi.",
    },
    "target-switching": {
      context:
        "Maydonda bir nechta shar bor va har biri almashtirilishidan oldin uchta alohida tegishni talab qiladi. Hozirgi nishonni tugatish bilan keyingi kamera burilishini muvozanatlashtirasiz. Natijada tugatilgan nishonlar va tugatish oraliqlari ko‘rsatiladi.",
      objective:
        "Ko‘rsatkichni ushlang, sharni mo‘ljallang va uchta alohida bosish bilan uring. Tugagach, belgini boshqa sharga olib boring va takrorlang.",
      tip: "Boshqa nishonga o‘tishdan oldin uchala tegish davomida mo‘ljalni barqaror saqlang. Avvalgi shar tugamagan bo‘lsa, tez burilishning foydasi kamayadi.",
      question: "Tugmani ushlab turish sharni avtomatik tugatadimi?",
      answer:
        "Yo‘q. Bu alohida bosish mashqi. Har bir sharga uchta tegish kerak; ushlab turish kuzatish mashqlarida ishlatiladi, bu yerda avtomatik otishni yoqmaydi.",
    },
  },
};

interface MechanicsCopy {
  title2d: string;
  title3d: string;
  metaSuffix: string;
  setupTimed: string;
  setupReaction: string;
  review: string;
  comparisonTip: string;
  controls2d: string;
  controls3d: string;
  controlsTracking2d: string;
  controlsTracking3d: string;
  controlsReaction: string;
  requirements2d: string;
  requirements3d: string;
  scoreClick: string;
  scoreTracking: string;
  scoreReaction: string;
  saveQuestion: string;
  saveAnswer: string;
  benchmarkQuestion: string;
  benchmarkAnswer: string;
  reactionQuestion: string;
  reactionAnswer: string;
}
const mechanics: Record<Locale, MechanicsCopy> = {
  en: {
    title2d: "2D aim training",
    title3d: "3D aim training",
    metaSuffix: "Free browser game. No account needed.",
    setupTimed:
      "Choose beginner, intermediate or advanced difficulty and a 30, 60 or 120-second round. Review the controls and start when ready.",
    setupReaction:
      "Choose a difficulty, review the controls and start the ten-trial reaction test. The difficulty sets the goal; the test still has ten trials.",
    review:
      "After the round, review the measured result and saved configuration. Compare only matching, uninterrupted benchmarks when judging changes in your scores.",
    comparisonTip:
      "Keep input type and difficulty consistent across comparisons. Pause for a break when needed; interrupted rounds are retained as practice rather than benchmark records.",
    controls2d:
      "Move the pointer and press the primary mouse button to shoot. In touch mode, tap the target inside the arena. Only arena input counts, and mouse and touch records are separate.",
    controls3d:
      "Start requests pointer lock. Move the mouse to turn the camera and click the primary button for each shot. Press Escape to release the pointer and pause the round.",
    controlsTracking2d:
      "Hold the primary mouse button and move over the target. In touch mode, maintain contact and drag with the moving circle. Releasing stops on-target credit, but active exposure continues.",
    controlsTracking3d:
      "Start requests pointer lock. Hold the primary mouse button and turn the camera to follow the sphere. Press Escape to release capture and pause. Releasing fire does not stop active target exposure.",
    controlsReaction:
      "Click or tap inside the arena after the visible cue. Pressing while waiting is a false start. You do not need to aim at a small target in this test.",
    requirements2d:
      "A browser with Canvas 2D support and a mouse or touch screen. No pointer lock or WebGL2 is required. Choose the matching input mode before starting.",
    requirements3d:
      "A desktop mouse and a browser supporting WebGL2 and pointer lock are required. Allow pointer capture when starting. If either feature is unavailable, choose a 2D game instead.",
    scoreClick:
      "Each hit adds 100 points and each miss subtracts 25; the final score cannot fall below zero. Accuracy is hits divided by shots, multiplied by 100. Center error and acquisition time are separate measurements.",
    scoreTracking:
      "Tracking percentage is 100 × time on target while firing ÷ all active target exposure. The score is that percentage × 10, rounded to a whole number. Releasing fire does not remove time from the denominator.",
    scoreReaction:
      "Score = max(0, round(1000 − median valid reaction time in ms − 100 × false starts − 100 × timeouts)). If no response is valid, the score is zero. The median describes valid responses, not missed trials.",
    saveQuestion: "Where are my results saved?",
    saveAnswer:
      "Results are saved in this browser’s local storage, with no account or automatic cloud sync. Export a JSON backup in Settings before clearing browser data or moving to another device.",
    benchmarkQuestion: "Can a paused round set a personal record?",
    benchmarkAnswer:
      "No. A completed round that was interrupted is practice only. Benchmark records require eligible uninterrupted runs with a matching scenario, difficulty, duration, input and other comparison settings.",
    reactionQuestion: "What happens if I click early or miss the cue?",
    reactionAnswer:
      "An early click records one false start and advances the test. No response within 1.5 seconds records a timeout. Each subtracts 100 points; neither is included as a valid reaction-time sample.",
  },
  es: {
    title2d: "puntería en 2D",
    title3d: "puntería en 3D",
    metaSuffix: "Gratis en el navegador, sin cuenta.",
    setupTimed:
      "Elige dificultad principiante, intermedia o avanzada y una ronda de 30, 60 o 120 segundos. Revisa los controles y empieza cuando estés listo.",
    setupReaction:
      "Elige una dificultad, revisa los controles e inicia la prueba de diez intentos. La dificultad fija el objetivo; el número de intentos sigue siendo diez.",
    review:
      "Al terminar, revisa el resultado medido y la configuración guardada. Compara solo rondas compatibles y sin interrupciones para interpretar cambios en tu puntuación.",
    comparisonTip:
      "Mantén el tipo de entrada y la dificultad al comparar. Descansa cuando lo necesites: las rondas interrumpidas se conservan como práctica, no como récords.",
    controls2d:
      "Mueve el puntero y pulsa el botón principal para disparar. En modo táctil, toca el objetivo dentro de la arena. Solo cuenta la entrada en la arena; ratón y táctil tienen récords separados.",
    controls3d:
      "Al iniciar se solicita capturar el puntero. Mueve el ratón para girar la cámara y pulsa el botón principal en cada disparo. Escape libera el puntero y pausa la ronda.",
    controlsTracking2d:
      "Mantén el botón principal y sigue el objetivo. En modo táctil, conserva el contacto y arrastra con el círculo. Soltar deja de sumar tiempo sobre el objetivo, pero la exposición activa continúa.",
    controlsTracking3d:
      "Al iniciar se captura el puntero. Mantén el botón principal y gira la cámara para seguir la esfera. Escape libera la captura y pausa. Soltar el disparo no detiene la exposición activa.",
    controlsReaction:
      "Haz clic o toca dentro de la arena después de la señal visual. Pulsar durante la espera es una salida falsa. No necesitas apuntar a un objetivo pequeño.",
    requirements2d:
      "Un navegador compatible con Canvas 2D y un ratón o pantalla táctil. No requiere captura del puntero ni WebGL2. Elige el modo de entrada adecuado antes de empezar.",
    requirements3d:
      "Requiere un ratón de escritorio y un navegador con WebGL2 y captura del puntero. Permite la captura al iniciar. Si alguna función no está disponible, elige un juego 2D.",
    scoreClick:
      "Cada acierto suma 100 puntos y cada fallo resta 25; el total no baja de cero. La precisión es aciertos divididos entre disparos, por 100. El error central y el tiempo de adquisición son medidas separadas.",
    scoreTracking:
      "El seguimiento es 100 × tiempo sobre el objetivo mientras disparas ÷ exposición activa total. La puntuación es ese porcentaje × 10, redondeado a un entero. Soltar no elimina tiempo del denominador.",
    scoreReaction:
      "Puntuación = máximo de 0 y el redondeo de 1000 − mediana válida en ms − 100 × salidas falsas − 100 × tiempos agotados. Sin respuestas válidas, son cero puntos. La mediana solo usa respuestas válidas.",
    saveQuestion: "¿Dónde se guardan mis resultados?",
    saveAnswer:
      "En el almacenamiento local de este navegador, sin cuenta ni sincronización automática. Exporta una copia JSON desde Ajustes antes de borrar datos o cambiar de dispositivo.",
    benchmarkQuestion: "¿Una ronda pausada puede establecer un récord?",
    benchmarkAnswer:
      "No. Una ronda terminada con interrupciones solo es práctica. Los récords exigen rondas válidas sin interrupciones y con escenario, dificultad, duración, entrada y demás ajustes compatibles.",
    reactionQuestion: "¿Qué ocurre si pulso antes o no respondo?",
    reactionAnswer:
      "Pulsar antes registra una salida falsa y avanza la prueba. No responder en 1,5 segundos registra un tiempo agotado. Cada error resta 100 puntos y no cuenta como muestra válida de reacción.",
  },
  de: {
    title2d: "Aim-Training in 2D",
    title3d: "Aim-Training in 3D",
    metaSuffix: "Kostenlos im Browser. Ohne Konto.",
    setupTimed:
      "Wähle eine der drei Schwierigkeitsstufen und eine Runde mit 30, 60 oder 120 Sekunden. Lies die Steuerung und starte, wenn du bereit bist.",
    setupReaction:
      "Wähle die Schwierigkeit, lies die Steuerung und starte den Test mit zehn Versuchen. Die Schwierigkeit bestimmt das Ziel; die Anzahl bleibt bei zehn.",
    review:
      "Prüfe danach den gemessenen Wert und die gespeicherten Einstellungen. Vergleiche nur passende, ununterbrochene Runden, wenn du Veränderungen deiner Ergebnisse beurteilst.",
    comparisonTip:
      "Halte Eingabeart und Schwierigkeit beim Vergleichen gleich. Pausiere bei Bedarf: Unterbrochene Runden bleiben als Übung gespeichert, setzen aber keine Bestleistungen.",
    controls2d:
      "Bewege den Zeiger und schieße mit der Hauptmaustaste. Tippe im Touch-Modus auf das Ziel in der Arena. Nur Arena-Eingaben zählen; Maus und Touch haben getrennte Bestleistungen.",
    controls3d:
      "Der Start fordert die Zeigererfassung an. Drehe die Kamera mit der Maus und klicke für jeden Schuss auf die Haupttaste. Escape gibt den Zeiger frei und pausiert die Runde.",
    controlsTracking2d:
      "Halte die Haupttaste und bewege den Zeiger über dem Ziel. Halte im Touch-Modus Kontakt und folge dem Kreis. Beim Loslassen endet die Zielgutschrift, die aktive Messzeit läuft weiter.",
    controlsTracking3d:
      "Der Start fordert die Zeigererfassung an. Halte die Haupttaste und folge der Kugel mit der Kamera. Escape löst die Erfassung und pausiert. Loslassen der Feuertaste verkürzt die aktive Messzeit nicht.",
    controlsReaction:
      "Klicke oder tippe nach dem sichtbaren Signal innerhalb der Arena. Ein Klick während des Wartens ist ein Fehlstart. Du musst dabei kein kleines Ziel treffen.",
    requirements2d:
      "Ein Browser mit Canvas-2D-Unterstützung sowie Maus oder Touchscreen. Zeigererfassung und WebGL2 sind nicht nötig. Wähle vor dem Start die passende Eingabeart.",
    requirements3d:
      "Erforderlich sind eine Desktop-Maus und ein Browser mit WebGL2 sowie Zeigererfassung. Erlaube die Erfassung beim Start. Falls eine Funktion fehlt, wähle eine 2D-Übung.",
    scoreClick:
      "Jeder Treffer bringt 100 Punkte, jeder Fehlschuss zieht 25 ab. Der Endwert bleibt mindestens null. Genauigkeit ist Treffer geteilt durch Schüsse mal 100. Mittelpunktfehler und Erfassungszeit werden getrennt gemessen.",
    scoreTracking:
      "Tracking-Prozent = 100 × Zielzeit beim Feuern ÷ gesamte aktive Zielpräsenz. Die Punktzahl ist dieser Prozentwert mal 10, auf eine ganze Zahl gerundet. Loslassen entfernt keine Zeit aus dem Nenner.",
    scoreReaction:
      "Punkte = Maximum aus 0 und dem gerundeten Wert 1000 − Median gültiger Reaktionen in ms − 100 × Fehlstarts − 100 × verpasste Versuche. Ohne gültige Reaktion sind es null Punkte. Der Median enthält nur gültige Antworten.",
    saveQuestion: "Wo werden meine Ergebnisse gespeichert?",
    saveAnswer:
      "Im lokalen Speicher dieses Browsers, ohne Konto oder automatische Cloud-Synchronisierung. Exportiere ein JSON-Backup in den Einstellungen, bevor du Browserdaten löschst oder das Gerät wechselst.",
    benchmarkQuestion: "Kann eine pausierte Runde eine Bestleistung setzen?",
    benchmarkAnswer:
      "Nein. Unterbrochene Runden zählen nur als Übung. Bestleistungen benötigen gültige ununterbrochene Runden mit passenden Szenario-, Schwierigkeits-, Zeit-, Eingabe- und weiteren Vergleichseinstellungen.",
    reactionQuestion:
      "Was passiert bei einem frühen Klick oder verpassten Signal?",
    reactionAnswer:
      "Ein früher Klick zählt als Fehlstart und beendet den Versuch. Ohne Antwort nach 1,5 Sekunden zählt er als verpasst. Beides kostet je 100 Punkte und ist kein gültiger Reaktionszeitwert.",
  },
  ru: {
    title2d: "тренировка прицела в 2D",
    title3d: "тренировка прицела в 3D",
    metaSuffix: "Бесплатно в браузере, без аккаунта.",
    setupTimed:
      "Выберите начальную, среднюю или продвинутую сложность и раунд на 30, 60 или 120 секунд. Изучите управление и запускайте, когда будете готовы.",
    setupReaction:
      "Выберите сложность, изучите управление и запустите тест из десяти попыток. Сложность задаёт порог цели, но попыток всегда десять.",
    review:
      "После раунда изучите измеренный результат и сохранённые настройки. Оценивайте изменения очков только по совместимым раундам без прерываний.",
    comparisonTip:
      "Сохраняйте одинаковые тип ввода и сложность при сравнении. Делайте паузу, когда нужен отдых: прерванные раунды сохраняются как практика, без рекордов.",
    controls2d:
      "Двигайте указатель и стреляйте основной кнопкой мыши. В сенсорном режиме касайтесь цели внутри арены. Учитывается только ввод в арене; рекорды мыши и сенсора разделены.",
    controls3d:
      "При запуске запрашивается захват указателя. Двигайте мышь для поворота камеры и нажимайте основную кнопку для каждого выстрела. Escape освобождает указатель и ставит раунд на паузу.",
    controlsTracking2d:
      "Удерживайте основную кнопку и ведите указатель по цели. В сенсорном режиме сохраняйте касание и двигайтесь за кругом. После отпускания время на цели не растёт, но общее активное время идёт.",
    controlsTracking3d:
      "Запуск запрашивает захват указателя. Удерживайте основную кнопку и поворачивайте камеру за сферой. Escape освобождает указатель и ставит паузу. Отпускание огня не останавливает активное время цели.",
    controlsReaction:
      "Нажмите мышью или коснитесь арены после видимого сигнала. Нажатие во время ожидания — фальстарт. Попадать в маленькую цель здесь не требуется.",
    requirements2d:
      "Браузер с поддержкой Canvas 2D и мышь либо сенсорный экран. Захват указателя и WebGL2 не требуются. Перед началом выберите соответствующий тип ввода.",
    requirements3d:
      "Нужны компьютерная мышь и браузер с WebGL2 и захватом указателя. Разрешите захват при запуске. Если нужная возможность недоступна, выберите игру 2D.",
    scoreClick:
      "Попадание даёт 100 очков, промах отнимает 25; итог не может быть ниже нуля. Точность — попадания, делённые на выстрелы и умноженные на 100. Отклонение от центра и время захвата считаются отдельно.",
    scoreTracking:
      "Процент сопровождения = 100 × время на цели во время огня ÷ всё активное время присутствия цели. Очки — этот процент × 10 с округлением до целого. Отпускание кнопки не уменьшает знаменатель.",
    scoreReaction:
      "Очки = максимум из 0 и округлённого значения 1000 − медиана корректной реакции в мс − 100 × фальстарты − 100 × пропуски. Если корректных ответов нет, счёт нулевой. Медиана учитывает только корректные ответы.",
    saveQuestion: "Где сохраняются мои результаты?",
    saveAnswer:
      "В локальном хранилище этого браузера, без аккаунта и автоматической синхронизации. Перед очисткой данных или сменой устройства экспортируйте резервную копию JSON в настройках.",
    benchmarkQuestion: "Можно поставить рекорд в раунде с паузой?",
    benchmarkAnswer:
      "Нет. Завершённый прерванный раунд остаётся практикой. Для рекорда нужен допустимый непрерывный раунд с совпадающими сценарием, сложностью, длительностью, вводом и прочими настройками сравнения.",
    reactionQuestion: "Что будет, если нажать раньше или пропустить сигнал?",
    reactionAnswer:
      "Раннее нажатие записывает фальстарт и завершает попытку. Нет ответа за 1,5 секунды — пропуск. Каждая ошибка отнимает 100 очков и не входит в выборку корректного времени реакции.",
  },
  uz: {
    title2d: "2D nishonga olish mashqi",
    title3d: "3D nishonga olish mashqi",
    metaSuffix: "Brauzerda bepul, hisobsiz o‘ynang.",
    setupTimed:
      "Boshlang‘ich, o‘rta yoki ilg‘or qiyinlik va 30, 60 yoki 120 soniyali raundni tanlang. Boshqaruvni ko‘rib, tayyor bo‘lganda boshlang.",
    setupReaction:
      "Qiyinlikni tanlang, boshqaruvni ko‘ring va o‘nta urinishli sinovni boshlang. Qiyinlik maqsadni belgilaydi, urinishlar esa baribir o‘nta bo‘ladi.",
    review:
      "Raunddan keyin o‘lchangan natija va saqlangan sozlamalarni ko‘ring. Ball o‘zgarishini baholashda faqat mos va to‘xtatilmagan raundlarni solishtiring.",
    comparisonTip:
      "Solishtirishda kiritish turi va qiyinlikni bir xil saqlang. Kerak bo‘lsa dam oling: to‘xtatilgan raundlar mashq sifatida saqlanadi, rekord hisoblanmaydi.",
    controls2d:
      "Ko‘rsatkichni siljiting va otish uchun asosiy tugmani bosing. Sensor rejimida maydon ichidagi nishonga teging. Faqat maydon ichidagi kiritish hisoblanadi; sichqoncha va sensor rekordlari alohida.",
    controls3d:
      "Boshlashda ko‘rsatkichni ushlash so‘raladi. Kamerani burish uchun sichqonchani siljiting, har bir o‘q uchun asosiy tugmani bosing. Escape ko‘rsatkichni bo‘shatib, raundni pauzaga qo‘yadi.",
    controlsTracking2d:
      "Asosiy tugmani ushlab, ko‘rsatkichni nishon bilan yurgizing. Sensor rejimida kontaktni saqlab, doira bilan siljiting. Qo‘yib yuborish nishondagi vaqtni to‘xtatadi, ammo faol baholash vaqti davom etadi.",
    controlsTracking3d:
      "Boshlashda ko‘rsatkich ushlanadi. Asosiy tugmani ushlab, kamerani shar ortidan buring. Escape ko‘rsatkichni bo‘shatib, pauza qiladi. Otishni qo‘yib yuborish faol vaqtni to‘xtatmaydi.",
    controlsReaction:
      "Ko‘rinadigan signaldan keyin maydon ichida bosing yoki teging. Kutish paytida bosish erta bosish hisoblanadi. Kichik nishonga mo‘ljallash shart emas.",
    requirements2d:
      "Canvas 2D qo‘llab-quvvatlaydigan brauzer va sichqoncha yoki sensor ekran. Ko‘rsatkichni ushlash va WebGL2 talab qilinmaydi. Boshlashdan oldin mos kiritish turini tanlang.",
    requirements3d:
      "Kompyuter sichqonchasi hamda WebGL2 va ko‘rsatkichni ushlashni qo‘llaydigan brauzer kerak. Boshlashda ushlashga ruxsat bering. Imkoniyatlardan biri bo‘lmasa, 2D o‘yinni tanlang.",
    scoreClick:
      "Har bir tegish 100 ball qo‘shadi, xato 25 ball ayiradi; yakuniy ball noldan past bo‘lmaydi. Aniqlik — tegishlar sonini otishlarga bo‘lib, 100 ga ko‘paytirish. Markazdan og‘ish va nishonga olish vaqti alohida o‘lchanadi.",
    scoreTracking:
      "Kuzatish foizi = 100 × otish paytida nishondagi vaqt ÷ nishonning barcha faol vaqti. Ball — shu foizni 10 ga ko‘paytirib, butun songa yaxlitlash. Tugmani qo‘yish maxrajdagi vaqtni kamaytirmaydi.",
    scoreReaction:
      "Ball = 0 va yaxlitlangan (1000 − to‘g‘ri reaksiya medianasi, ms − 100 × erta bosishlar − 100 × o‘tkazib yuborishlar) ichidan kattasi. To‘g‘ri javob bo‘lmasa, ball nol. Mediana faqat to‘g‘ri javoblarni oladi.",
    saveQuestion: "Natijalarim qayerda saqlanadi?",
    saveAnswer:
      "Shu brauzerning mahalliy xotirasida, hisob va avtomatik bulutli sinxronlashsiz. Brauzer ma’lumotlarini o‘chirish yoki boshqa qurilmaga o‘tishdan oldin Sozlamalardan JSON zaxira nusxasini eksport qiling.",
    benchmarkQuestion: "Pauza qilingan raund rekord bo‘la oladimi?",
    benchmarkAnswer:
      "Yo‘q. To‘xtatilgan raund yakunlansa ham, amaliy mashq hisoblanadi. Rekord uchun ssenariy, qiyinlik, davomiylik, kiritish va boshqa solishtirish sozlamalari mos bo‘lgan uzluksiz raund kerak.",
    reactionQuestion:
      "Erta bossam yoki signalni o‘tkazib yuborsam nima bo‘ladi?",
    reactionAnswer:
      "Erta bosish qayd etilib, urinish tugaydi. 1,5 soniyada javob bo‘lmasa, o‘tkazib yuborish yoziladi. Har biri 100 ball ayiradi va to‘g‘ri reaksiya namunasi sifatida olinmaydi.",
  },
};

const threeD = new Set<ScenarioId>([
  "sphere-flick",
  "precision-range",
  "strafe-tracking",
  "reactive-tracking",
  "target-switching",
]);

export function getGameCopy(locale: Locale, scenarioId: ScenarioId): GameCopy {
  const detail = gameDetails[locale][scenarioId];
  const m = mechanics[locale];
  const is3d = threeD.has(scenarioId);
  const tracking = scenarioId.includes("tracking");
  const reaction = scenarioId === "reaction-tap";
  const name = dictionaries[locale][scenarioId];
  const description = dictionaries[locale][`${scenarioId}Desc`];
  return {
    name,
    title: `${name} — ${is3d ? m.title3d : m.title2d} | AimForge`,
    description: `${description} ${m.metaSuffix}`,
    intro: `${description} ${detail.context}`,
    howTo: [
      reaction ? m.setupReaction : m.setupTimed,
      detail.objective,
      m.review,
    ],
    tips: [detail.tip, m.comparisonTip],
    controls: reaction
      ? m.controlsReaction
      : tracking
        ? is3d
          ? m.controlsTracking3d
          : m.controlsTracking2d
        : is3d
          ? m.controls3d
          : m.controls2d,
    scoring: reaction
      ? m.scoreReaction
      : tracking
        ? m.scoreTracking
        : m.scoreClick,
    requirements: is3d ? m.requirements3d : m.requirements2d,
    faq: [
      { question: detail.question, answer: detail.answer },
      reaction
        ? { question: m.reactionQuestion, answer: m.reactionAnswer }
        : tracking
          ? { question: m.benchmarkQuestion, answer: m.benchmarkAnswer }
          : { question: m.saveQuestion, answer: m.saveAnswer },
    ],
  };
}
