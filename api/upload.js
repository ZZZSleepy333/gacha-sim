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

const uploadImageToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "banners",
    });
    return result.secure_url;
  } catch (error) {
    console.error("❌ Lỗi khi upload Cloudinary:", error);
    throw new Error("Upload ảnh thất bại!");
  }
};

// 👇 Cấu hình Next.js để xử lý file upload
export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser để dùng formidable
  },
};

const uploadMiddleware = upload.single("image");

export default async function handler(req, res) {
  const db = await connectDB();

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("❌ Lỗi upload Multer:", err);
      return res.status(500).json({ error: "Lỗi upload file!" });
    }

    try {
      const { name, characters } = req.body;
      if (!name || !characters) {
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc!" });
      }

      let imageUrl = req.file ? req.file.path : null;

      const result = await db.collection("banners").insertOne({
        name,
        characters: JSON.parse(characters),
        imageUrl,
      });

      res.json({ message: "Banner đã lưu!", id: result.insertedId, imageUrl });
    } catch (error) {
      console.error("❌ Lỗi xử lý server:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  });
}
