/**
 * ============================================================================
 * GARDE DE CONTRASTE WCAG — jetons de thème
 * ----------------------------------------------------------------------------
 * Vérifie les **paires de jetons** déclarées dans `src/app/globals.css`, pas
 * leur usage dans les composants : le script ne peut pas voir un
 * `text-primary` posé sur du blanc. C'est le lot correctif (hors périmètre de
 * ce garde-fou) qui doit auditer les usages ; ici, on garantit seulement que
 * les jetons eux-mêmes restent lisibles ensemble.
 *
 * Pourquoi un script et non un test : le projet n'a aucun runner de tests, et
 * `tsx` est déjà une devDependency — aucune dépendance ajoutée. Pourquoi les
 * calculs WCAG restent ici au lieu de `src/lib/` : tant qu'aucun thème
 * dynamique n'existe, les y promouvoir créerait du code mort (convention du
 * projet). À déplacer le jour où un vrai système de thèmes arrive.
 *
 * La table ci-dessous est un **instantané** de `globals.css` : toute retouche
 * d'un jeton doit être répercutée ici, sinon la garde mesure une valeur qui
 * n'existe plus.
 *
 * Usage : `npm run check:contrast` — code de sortie 1 si une paire
 * **obligatoire** passe sous son seuil ; les paires secondaires ne produisent
 * que des avertissements.
 * ============================================================================
 */

type Rgb = { r: number; g: number; b: number; a: number };

type ThemeCheck = {
  /** Libellé affiché, ex. `--text-color sur --bg-color`. */
  label: string;
  /** Nom du jeton de premier plan dans la table `tokens`. */
  foreground: string;
  /** Nom du jeton de fond. */
  background: string;
  /** Seuil minimal (4,5 pour du texte, 3 pour du non textuel). */
  min: number;
  /** `true` : échec bloquant ; `false` : simple avertissement. */
  required: boolean;
};

type CtaExpectation = {
  /** Libellé du couple CTA contrôlé. */
  label: string;
  /** Jeton de fond de CTA. */
  background: string;
  /** Jeton de texte déclaré pour ce fond. */
  foreground: string;
};

type Theme = {
  name: string;
  tokens: Record<string, string>;
  checks: ThemeCheck[];
  ctaExpectations: CtaExpectation[];
};

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };

/** Accepte `#rgb`, `#rrggbb`, `rgb(...)` et `rgba(...)`. */
function parseColor(input: string): Rgb {
  const value = input.trim().toLowerCase();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((character) => character + character)
            .join("")
        : hex;
    if (!/^[0-9a-f]{6}$/.test(expanded)) {
      throw new Error(`Couleur hex invalide : ${input}`);
    }
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
      a: 1,
    };
  }

  const match = value.match(/^rgba?\(([^)]+)\)$/);
  if (!match) {
    throw new Error(`Couleur non reconnue : ${input}`);
  }
  const parts = match[1].split(",").map((part) => Number(part.trim()));
  const [r, g, b, a = 1] = parts;
  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    throw new Error(`Couleur non reconnue : ${input}`);
  }
  return { r, g, b, a };
}

/** Aplatit `foreground` sur `background` (couleur opaque en sortie). */
function blend(foreground: Rgb, background: Rgb): Rgb {
  const alpha = foreground.a;
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1,
  };
}

/** Luminance relative WCAG 2.1 (0 = noir, 1 = blanc), sur une couleur opaque. */
function luminance(color: Rgb): number {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

/** Luminance d'une couleur textuelle, son alpha éventuel aplati sur blanc. */
function relativeLuminance(color: string): number {
  return luminance(blend(parseColor(color), WHITE));
}

/**
 * Ratio de contraste WCAG entre deux couleurs.
 *
 * Les deux couleurs sont d'abord **composées** avant mesure : un texte
 * translucide (`--text-muted`) est aplati sur son fond, sinon sa luminance
 * serait celle de la couleur pure et le ratio surestimé ; un fond translucide
 * (`--border-color` sombre) est aplati sur blanc, faute de référence opaque.
 */
function contrastRatio(foreground: string, background: string): number {
  const bg = blend(parseColor(background), WHITE);
  const fg = blend(parseColor(foreground), bg);
  const [lighter, darker] = [luminance(fg), luminance(bg)].sort(
    (x, y) => y - x
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Texte de CTA attendu pour un fond donné : le plus lisible des deux extrêmes.
 * C'est la règle « accent clair → texte sombre, accent foncé → texte clair ».
 */
function readableForeground(background: string): string {
  return contrastRatio("#1a1a1a", background) >=
    contrastRatio("#ffffff", background)
    ? "#1a1a1a"
    : "#ffffff";
}

/** Classe une couleur en sombre/clair pour comparer deux choix de texte. */
function isDark(color: string): boolean {
  return relativeLuminance(color) < 0.5;
}

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/* ==========================================================================
   Table des thèmes — miroir de src/app/globals.css
   ========================================================================== */

const LIGHT: Theme = {
  name: ":root (site public, clair)",
  tokens: {
    "--bg-color": "#ffffff",
    "--surface-color": "#faf8f8",
    "--surface-color-soft": "#fbf7f6",
    "--text-color": "#1a1a1a",
    "--accent-color": "#e8d8d7",
    "--accent-color-strong": "#d8c3c2",
    "--border-color": "#eae5e5",
    "--text-muted": "rgba(26, 26, 26, 0.6)",
    "--primary": "#e8d8d7",
    "--primary-foreground": "#1a1a1a",
    "--accent": "#e8d8d7",
    "--accent-foreground": "#1a1a1a",
    "--ring": "#d8c3c2",
  },
  checks: [
    {
      label: "--text-color sur --bg-color",
      foreground: "--text-color",
      background: "--bg-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-color sur --surface-color",
      foreground: "--text-color",
      background: "--surface-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
      min: 4.5,
      required: true,
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-muted sur --surface-color",
      foreground: "--text-muted",
      background: "--surface-color",
      min: 4.5,
      required: false,
    },
    {
      label: "--ring sur --bg-color (non textuel)",
      foreground: "--ring",
      background: "--bg-color",
      min: 3,
      required: false,
    },
    {
      /* `--primary` sert aussi de TEXTE (`link`, `text-primary`) : on le mesure
         sur le fond de page. Non bloquant pour ne pas faire échouer le thème
         par défaut, dont le rose nacré est déjà une non-conformité connue. */
      label: "--primary sur --bg-color (texte)",
      foreground: "--primary",
      background: "--bg-color",
      min: 4.5,
      required: false,
    },
  ],
  ctaExpectations: [
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
    },
  ],
};

const DARK: Theme = {
  name: ".dark (site public, sombre)",
  tokens: {
    "--bg-color": "#161313",
    "--surface-color": "#201c1c",
    "--text-color": "#f4f0ef",
    "--accent-color": "#d8c3c2",
    "--accent-color-strong": "#c7aead",
    "--border-color": "rgba(244, 240, 239, 0.12)",
    "--text-muted": "rgba(244, 240, 239, 0.62)",
    "--primary": "#d8c3c2",
    "--primary-foreground": "#1a1a1a",
    "--accent": "#d8c3c2",
    "--accent-foreground": "#1a1a1a",
    "--ring": "#c7aead",
  },
  checks: [
    {
      label: "--text-color sur --bg-color",
      foreground: "--text-color",
      background: "--bg-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-color sur --surface-color",
      foreground: "--text-color",
      background: "--surface-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
      min: 4.5,
      required: true,
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-muted sur --surface-color",
      foreground: "--text-muted",
      background: "--surface-color",
      min: 4.5,
      required: false,
    },
    {
      label: "--ring sur --bg-color (non textuel)",
      foreground: "--ring",
      background: "--bg-color",
      min: 3,
      required: false,
    },
    {
      /* `--primary` sert aussi de TEXTE (`link`, `text-primary`) : on le mesure
         sur le fond de page. Non bloquant pour ne pas faire échouer le thème
         par défaut, dont le rose nacré est déjà une non-conformité connue. */
      label: "--primary sur --bg-color (texte)",
      foreground: "--primary",
      background: "--bg-color",
      min: 4.5,
      required: false,
    },
  ],
  ctaExpectations: [
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
    },
  ],
};

const ADMIN: Theme = {
  name: ".admin (back-office, zinc)",
  tokens: {
    "--background": "#ffffff",
    "--foreground": "#18181b",
    "--surface-color": "#fafafa",
    "--primary": "#18181b",
    "--primary-foreground": "#ffffff",
    "--accent": "#f4f4f5",
    "--accent-foreground": "#18181b",
    "--ring": "#a1a1aa",
  },
  checks: [
    {
      label: "--foreground sur --background",
      foreground: "--foreground",
      background: "--background",
      min: 4.5,
      required: true,
    },
    {
      label: "--foreground sur --surface-color",
      foreground: "--foreground",
      background: "--surface-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
      min: 4.5,
      required: true,
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
      min: 4.5,
      required: true,
    },
    {
      label: "--ring sur --background (non textuel)",
      foreground: "--ring",
      background: "--background",
      min: 3,
      required: false,
    },
    {
      /* `--primary` sert aussi de TEXTE (`link`, `text-primary`) : on le mesure
         sur le fond de page. Non bloquant (cf. LIGHT/DARK). */
      label: "--primary sur --background (texte)",
      foreground: "--primary",
      background: "--background",
      min: 4.5,
      required: false,
    },
  ],
  ctaExpectations: [
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
    },
  ],
};

/* --------------------------------------------------------------------------
   Presets opt-in `.theme-<id>` — miroir de la section « PRESETS DE THÈME »
   de globals.css. Le bloc CSS ne déclare que les jetons produit ; les alias
   shadcn (`--primary`, `--accent`, `--ring`) restent résolus par `:root`, d'où
   la fabrique ci-dessous qui recompose leur valeur comme le navigateur le fait.
   -------------------------------------------------------------------------- */

/** Paires contrôlées, identiques pour les six presets. */
function presetChecks(): ThemeCheck[] {
  return [
    {
      label: "--text-color sur --bg-color",
      foreground: "--text-color",
      background: "--bg-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-color sur --surface-color",
      foreground: "--text-color",
      background: "--surface-color",
      min: 4.5,
      required: true,
    },
    {
      label: "--primary-foreground sur --primary",
      foreground: "--primary-foreground",
      background: "--primary",
      min: 4.5,
      required: true,
    },
    {
      label: "--accent-foreground sur --accent",
      foreground: "--accent-foreground",
      background: "--accent",
      min: 4.5,
      required: true,
    },
    {
      label: "--text-muted sur --surface-color",
      foreground: "--text-muted",
      background: "--surface-color",
      min: 4.5,
      required: false,
    },
    {
      label: "--ring sur --bg-color (non textuel)",
      foreground: "--ring",
      background: "--bg-color",
      min: 3,
      required: false,
    },
    {
      label: "--primary sur --bg-color (texte)",
      foreground: "--primary",
      background: "--bg-color",
      min: 4.5,
      required: false,
    },
  ];
}

const PRESET_CTA: CtaExpectation[] = [
  {
    label: "--primary-foreground sur --primary",
    foreground: "--primary-foreground",
    background: "--primary",
  },
  {
    label: "--accent-foreground sur --accent",
    foreground: "--accent-foreground",
    background: "--accent",
  },
];

/** Compose un preset clair/sombre : produit + alias résolus comme `:root`. */
function preset(name: string, product: Record<string, string>): Theme {
  return {
    name,
    tokens: {
      ...product,
      "--primary": product["--accent-color"],
      "--accent": product["--accent-color"],
      "--ring": product["--accent-color-strong"],
    },
    checks: presetChecks(),
    ctaExpectations: PRESET_CTA,
  };
}

const PRESETS: Theme[] = [
  preset("Preset .theme-corporate (clair)", {
    "--bg-color": "#ffffff",
    "--text-color": "#1e293b",
    "--surface-color": "#f8fafc",
    "--surface-color-soft": "#f1f5f9",
    "--accent-color": "#1d4ed8",
    "--accent-color-strong": "#1e40af",
    "--border-color": "#e2e8f0",
    "--text-muted": "#64748b",
    "--primary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--secondary": "#f1f5f9",
    "--secondary-foreground": "#0f172a",
    "--muted": "#f1f5f9",
    "--destructive": "#dc2626",
    "--destructive-foreground": "#ffffff",
  }),
  preset("Preset .theme-tech-minimaliste (clair)", {
    "--bg-color": "#fafafa",
    "--text-color": "#18181b",
    "--surface-color": "#ffffff",
    "--surface-color-soft": "#f4f4f5",
    "--accent-color": "#047857",
    "--accent-color-strong": "#065f46",
    "--border-color": "#e4e4e7",
    "--text-muted": "#71717a",
    "--primary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--secondary": "#f4f4f5",
    "--secondary-foreground": "#18181b",
    "--muted": "#f4f4f5",
    "--destructive": "#dc2626",
    "--destructive-foreground": "#ffffff",
  }),
  preset("Preset .theme-terre-atelier (clair)", {
    "--bg-color": "#fdfbf7",
    "--text-color": "#2d241e",
    "--surface-color": "#f4efea",
    "--surface-color-soft": "#ebe3db",
    "--accent-color": "#b04d32",
    "--accent-color-strong": "#8f3c24",
    "--border-color": "#e2d7cd",
    "--text-muted": "#78685e",
    "--primary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--secondary": "#ebe3db",
    "--secondary-foreground": "#2d241e",
    "--muted": "#ebe3db",
    "--destructive": "#b91c1c",
    "--destructive-foreground": "#ffffff",
  }),
  preset("Preset .theme-sauge-cabinet (clair)", {
    "--bg-color": "#f4f6f4",
    "--text-color": "#1c2826",
    "--surface-color": "#ffffff",
    "--surface-color-soft": "#e8ebe8",
    "--accent-color": "#8c6311",
    "--accent-color-strong": "#6e4d0c",
    "--border-color": "#d5dbd5",
    "--text-muted": "#5c6b68",
    "--primary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--secondary": "#e8ebe8",
    "--secondary-foreground": "#1c2826",
    "--muted": "#e8ebe8",
    "--destructive": "#b91c1c",
    "--destructive-foreground": "#ffffff",
  }),
  preset("Preset .theme-galerie-luxe (sombre, coupler avec .dark)", {
    "--bg-color": "#121212",
    "--text-color": "#f5f5f5",
    "--surface-color": "#1e1e1e",
    "--surface-color-soft": "#2a2a2a",
    "--accent-color": "#d4af37",
    "--accent-color-strong": "#f3c846",
    "--border-color": "#333333",
    "--text-muted": "#a3a3a3",
    "--primary-foreground": "#121212",
    "--accent-foreground": "#121212",
    "--secondary": "#2a2a2a",
    "--secondary-foreground": "#f5f5f5",
    "--muted": "#2a2a2a",
    "--destructive": "#ef4444",
    "--destructive-foreground": "#ffffff",
  }),
  preset("Preset .theme-girly-baby (clair)", {
    "--bg-color": "#fff9fb",
    "--text-color": "#2d1f25",
    "--surface-color": "#ffffff",
    "--surface-color-soft": "#fdebf2",
    "--accent-color": "#9e3b68",
    "--accent-color-strong": "#7d2b50",
    "--border-color": "#f3d2e1",
    "--text-muted": "#7d626e",
    "--primary-foreground": "#ffffff",
    "--accent-foreground": "#ffffff",
    "--secondary": "#fdebf2",
    "--secondary-foreground": "#2d1f25",
    "--muted": "#fdebf2",
    "--destructive": "#be123c",
    "--destructive-foreground": "#ffffff",
  }),
];

const THEMES: Theme[] = [LIGHT, DARK, ADMIN, ...PRESETS];

/* ==========================================================================
   Exécution
   ========================================================================== */

let failures = 0;
let warnings = 0;

console.log("Garde de contraste WCAG — jetons de thème (src/app/globals.css)");
console.log("Seuils : texte 4,5:1 (AA) — non textuel 3:1.\n");

for (const theme of THEMES) {
  console.log(`Thème ${theme.name}`);

  for (const check of theme.checks) {
    const foreground = theme.tokens[check.foreground];
    const background = theme.tokens[check.background];
    const ratio = contrastRatio(foreground, background);
    const passes = ratio >= check.min;

    if (!passes) {
      if (check.required) {
        failures += 1;
      } else {
        warnings += 1;
      }
    }

    const status = passes ? "[ ok ]" : check.required ? "[FAIL]" : "[warn]";
    const note = passes ? "" : check.required ? "  <- bloquant" : "  (non bloquant)";
    console.log(
      `  ${status} ${check.label.padEnd(42)} ${formatRatio(ratio).padStart(
        8
      )}  min ${formatRatio(check.min)}${note}`
    );
  }

  for (const expectation of theme.ctaExpectations) {
    const background = theme.tokens[expectation.background];
    const foreground = theme.tokens[expectation.foreground];
    const expected = readableForeground(background);
    const conforms = isDark(expected) === isDark(foreground);
    if (!conforms) {
      warnings += 1;
    }
    console.log(
      `  ${conforms ? "[ ok ]" : "[warn]"} ${expectation.label.padEnd(42)} ` +
        `texte ${isDark(foreground) ? "sombre" : "clair"} attendu ${
          isDark(expected) ? "sombre" : "clair"
        }`
    );
  }

  console.log("");
}

console.log(
  `Résultat : ${failures} paire(s) obligatoire(s) en échec, ${warnings} avertissement(s).`
);

if (failures > 0) {
  console.error("ÉCHEC — corriger les jetons ou la table de scripts/check-contrast.ts.");
  process.exitCode = 1;
} else {
  console.log("Paires obligatoires conformes.");
}
