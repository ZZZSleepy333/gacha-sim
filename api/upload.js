import { IncomingForm } from "formidable";
import fs from "fs/promises";
import { MongoClient } from "mongodb";
import path from "path";
import cloudinary from "cloudinary";

const MONGO_URI =
  "mongodb+srv://namnguyenhoang0903:01202902494@cluster0.su7jf.mongodb.net/";
const DB_NAME = "banner_db";

cloudinary.config({
  cloud_name: "dhdhxoqxs",
  api_key: 224474966178738,
  api_secret: "eBDr5tU0_CyUI2pc5Kn8OGmDEmQ",
});

let db;

const connectDB = async () => {
  if (!db) {
    const client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db(DB_NAME);
  }
  return db;
};

export default async function handler(req, res) {
  const form = new IncomingForm();
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
    const file = files.image; // Giả sử tên input file là 'image'

    try {
      // Tải lên Cloudinary
      const result = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: "banners", // Thư mục trên Cloudinary
      });

      const imageUrl = result.secure_url; // URL của hình ảnh trên Cloudinary

      const db = await connectDB();
      const dbResult = await db.collection("banners").insertOne({
        name,
        characters: JSON.parse(characters),
        imageUrl,
        file,
      });

      console.log("✅ Banner đã lưu!", dbResult.insertedId);

      res.json({
        message: "Banner đã lưu!",
        id: dbResult.insertedId,
      });
    } catch (error) {
      console.error("❌ Lỗi khi thêm dữ liệu vào MongoDB:", error);
      return res.status(500).json({ error: "Lỗi server" });
    }
  });
}
