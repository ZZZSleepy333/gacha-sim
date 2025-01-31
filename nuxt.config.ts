import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["@/assets/css/main.css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  pages: true,
  nitro: {
    preset: "vercel",
  },
  runtimeConfig: {
    public: {
      apiBase: "/api",
    },
  },
});
