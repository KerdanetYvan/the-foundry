import { T } from "@/lib/tokens";
import { GEAR_ART, GEAR_PAL, ROCKET_ART, ROCKET_PAL, TRAIN_ART, TRAIN_PAL } from "@/lib/pixelArt";

export interface Feature {
  tag: string;
  title: string;
  copy: string;
  art: string[];
  palette: Record<string, string>;
  cell: number;
  accent: string;
  glow: string;
}

export interface Step {
  n: string;
  title: string;
  body: string;
  link?: { label: string; href: string };
  note?: string;
}

export interface Mod {
  name: string;
  accent: string;
}

export const FEATURES: Feature[] = [
  {
    tag:     "CREATE MOD",
    title:   "L'industrie\nse construit",
    copy:    "Des roues dentées qui s'emboîtent, des convoyeurs qui alimentent des fours, des presses et des mélangeurs. Tu crées des systèmes mécaniques aussi complexes que tu veux. De la première machine à la mégausine automatisée.",
    art:     GEAR_ART,
    palette: GEAR_PAL,
    cell:    14,
    accent:  T.copper,
    glow:    "rgba(212,137,42,0.12)",
  },
  {
    tag:     "STEAM 'N' RAILS",
    title:   "Le réseau\nse tisse",
    copy:    "Pose des rails entre les bases. Construis des gares, programme des horaires, regarde un train que tu as construit traverser un biome à toute vitesse. Le réseau s'étend à mesure que le serveur grandit.",
    art:     TRAIN_ART,
    palette: TRAIN_PAL,
    cell:    9,
    accent:  "#60A5FA",
    glow:    "rgba(96,165,250,0.10)",
  },
  {
    tag:     "NORTHSTAR REDUX",
    title:   "L'espace\nse conquiert",
    copy:    "Lance une fusée depuis ton pas-de-tir. Atterris sur la Lune. Mine du Titane sur Vénus. Rentre avec des matériaux introuvables sur Terre. L'horizon n'est pas la limite, c'est juste le début.",
    art:     ROCKET_ART,
    palette: ROCKET_PAL,
    cell:    12,
    accent:  "#A78BFA",
    glow:    "rgba(167,139,250,0.12)",
  },
];

export const STEPS: Step[] = [
  {
    n:     "01",
    title: "Installe CurseForge",
    body:  "Télécharge l'app CurseForge — elle gère l'installation et les mises à jour du modpack.",
    link:  { label: "curseforge.com/download/app", href: "https://www.curseforge.com/download/app" },
  },
  {
    n:     "02",
    title: "Installe le modpack",
    body:  "Ouvre CurseForge, clique sur le lien ci-dessous et installe The Space Foundry. Les ~2 Go se téléchargent tout seuls.",
    link:  { label: "The Space Foundry sur CurseForge", href: "https://www.curseforge.com/minecraft/modpacks/the-space-foundry" },
    note:  "Alloue 4 Go minimum de RAM dans les paramètres du profil.",
  },
  {
    n:     "03",
    title: "Lance et rejoins",
    body:  "Lance Minecraft depuis le profil. Multijoueur → Ajouter un serveur → colle l'adresse ci-dessous.",
  },
];

export const MODS: Mod[] = [
  { name: "Create",              accent: T.copper   },
  { name: "Steam 'n' Rails",    accent: "#60A5FA"  },
  { name: "Northstar Redux",    accent: "#A78BFA"  },
  { name: "New Age",            accent: T.copper   },
  { name: "Diesel Generators",  accent: T.copper   },
  { name: "Enchantment Indus.", accent: "#60A5FA"  },
  { name: "Slice & Dice",       accent: T.grass    },
  { name: "Farmer's Delight",   accent: T.grass    },
  { name: "Simple Voice Chat",  accent: "#34D399"  },
  { name: "Waystones",          accent: "#F0A03A"  },
  { name: "JEI",                accent: T.muted    },
  { name: "Xaero's Maps",       accent: T.muted    },
];
