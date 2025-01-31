import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ["@/assets/css/main.css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  pages: true,
  // runtimeConfig: {
  //   // Nếu muốn các biến này có thể truy cập từ client-side, thêm vào `public`
  //   public: {
  //     API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3001",
  //     MONGO_URI: process.env.MONGO_URI,
  //     DB_NAME: process.env.DB_NAME,
  //     CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  //     CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  //     CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  //   },
  // },
});
