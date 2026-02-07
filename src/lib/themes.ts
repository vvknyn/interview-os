export interface ThemeColors {
  brand: string;
  "brand-foreground": string;
  "brand-muted": string;
}

export interface Theme {
  name: string;
  label: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}

export const themes: Record<string, Theme> = {
  neutral: {
    name: "neutral",
    label: "Neutral",
    colors: {
      light: {
        brand: "10 10 10",
        "brand-foreground": "255 255 255",
        "brand-muted": "115 115 115",
      },
      dark: {
        brand: "250 250 250",
        "brand-foreground": "10 10 10",
        "brand-muted": "161 161 161",
      },
    },
  },
  indigo: {
    name: "indigo",
    label: "Indigo",
    colors: {
      light: {
        brand: "99 102 241",
        "brand-foreground": "255 255 255",
        "brand-muted": "165 180 252",
      },
      dark: {
        brand: "129 140 248",
        "brand-foreground": "15 15 25",
        "brand-muted": "99 102 241",
      },
    },
  },
  blue: {
    name: "blue",
    label: "Blue",
    colors: {
      light: {
        brand: "59 130 246",
        "brand-foreground": "255 255 255",
        "brand-muted": "147 197 253",
      },
      dark: {
        brand: "96 165 250",
        "brand-foreground": "10 15 30",
        "brand-muted": "59 130 246",
      },
    },
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    colors: {
      light: {
        brand: "16 185 129",
        "brand-foreground": "255 255 255",
        "brand-muted": "110 231 183",
      },
      dark: {
        brand: "52 211 153",
        "brand-foreground": "10 20 15",
        "brand-muted": "16 185 129",
      },
    },
  },
  rose: {
    name: "rose",
    label: "Rose",
    colors: {
      light: {
        brand: "244 63 94",
        "brand-foreground": "255 255 255",
        "brand-muted": "253 164 175",
      },
      dark: {
        brand: "251 113 133",
        "brand-foreground": "25 10 15",
        "brand-muted": "244 63 94",
      },
    },
  },
  amber: {
    name: "amber",
    label: "Amber",
    colors: {
      light: {
        brand: "245 158 11",
        "brand-foreground": "255 255 255",
        "brand-muted": "252 211 77",
      },
      dark: {
        brand: "251 191 36",
        "brand-foreground": "25 20 5",
        "brand-muted": "245 158 11",
      },
    },
  },
};

export const themeNames = Object.keys(themes) as (keyof typeof themes)[];

export const DEFAULT_THEME = "neutral";

export function getTheme(name: string): Theme {
  return themes[name] || themes[DEFAULT_THEME];
}
