import { IncomingForm } from "formidable";
import fs from "fs/promises";
import { MongoClient } from "mongodb";

const MONGO_URI = "your_mongo_uri";
const DB_NAME = "your_db_name";

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
