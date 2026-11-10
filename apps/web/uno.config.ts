import { defineConfig, presetWind4 } from "unocss";

export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      accent: "#1237e6",
    },
    font: {
      display: "Newsreader, Georgia, serif",
      sans: 'Figtree, "Segoe UI", sans-serif',
    },
  },
  shortcuts: {
    btn: "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm leading-none transition-colors duration-150 enabled:cursor-pointer disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "btn-primary": "btn border-0 bg-accent text-white enabled:hover:bg-black",
    "btn-quiet": "btn border border-black/15 bg-white text-black/70 enabled:hover:border-black enabled:hover:text-black",
    "btn-ink": "btn border border-black bg-white text-black enabled:hover:bg-black enabled:hover:text-white",
    panel: "grid gap-3 rounded-2xl border border-black/10 bg-white p-3.5",
    field: "min-h-24 w-full resize-y border-0 bg-transparent px-2 py-2 font-sans text-base text-black outline-none placeholder:text-black/35 disabled:opacity-50",
  },
});
