import { MongoClient } from "mongodb";
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: "dhdhxoqxs",
  api_key: "224474966178738",
  api_secret: "eBDr5tU0_CyUI2pc5Kn8OGmDEmQ",
});

const MONGO_URI =
  "mongodb+srv://namnguyenhoang0903:01202902494@cluster0.su7jf.mongodb.net/";
const DB_NAME = "banner_db";

let db;
const connectDB = async () => {
  if (!db) {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
  }
  return db;
};

// const uploadImageToCloudinary = async (filePath) => {
//   try {
//     const result = await cloudinary.uploader.upload(filePath, {
//       folder: "banners",
//     });
//     return result.secure_url;
//   } catch (error) {
//     console.error("❌ Lỗi khi upload Cloudinary:", error);
//     throw new Error("Upload ảnh thất bại!");
//   }
// };

// 👇 Cấu hình Next.js để xử lý file upload
export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser để dùng formidable
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.uploadDir = "/tmp"; // Chỉ lưu tạm vì Vercel không cho lưu file lâu dài
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Lỗi xử lý upload:", err);
      return res.status(500).json({ error: "Lỗi upload hình ảnh" });
    }

    console.log("📝 Data nhận được:", fields);
    console.log("🖼️ File nhận được:", files);

    const { name, characters } = fields;

    try {
      const db = await connectDB();
      const result = await db.collection("banners").insertOne({
        name,
        characters: JSON.parse(characters),
        files,
      });

      console.log("✅ Banner đã lưu!", result.insertedId);

      res.json({
        message: "Banner đã lưu!",
        id: result.insertedId,
      });
    } catch (error) {
      console.error("❌ Lỗi khi thêm dữ liệu vào MongoDB:", error);
      return res.status(500).json({ error: "Lỗi server" });
    }
  });
}
