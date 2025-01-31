import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["@/assets/css/main.css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  pages: true,
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE || "https://gacha-sim.vercel.app/",
    },
  },
});
