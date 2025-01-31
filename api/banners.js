import { MongoClient } from "mongodb";
import formidable from "formidable";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dhdhxoqxs",
  api_key: 224474966178738,
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

export default async function handler(req, res) {
  const db = await connectDB();

  if (req.method === "POST") {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) {
          return res.status(500).json({ error: "Lỗi phân tích form" });
        }

        const { name, characters } = fields;
        const imageFile = files.image;

        if (!name || !characters || !imageFile) {
          return res
            .status(400)
            .json({ error: "Tên, danh sách nhân vật & hình ảnh là bắt buộc!" });
        }

        // Tải ảnh lên Cloudinary
        const imagePath = imageFile.filepath;
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
          folder: "banners",
        });

        // Lưu vào MongoDB
        const result = await db.collection("banners").insertOne({
          name,
          characters: JSON.parse(characters),
          imageUrl: uploadResult.secure_url, // Lưu URL ảnh vào DB
        });

        // Xóa file ảnh tạm sau khi upload
        await fs.unlink(imagePath);

        res.json({ message: "Banner đã lưu!", id: result.insertedId });
      });
    } catch (error) {
      console.error("❌ Lỗi khi lưu banner:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  } else if (req.method === "GET") {
    try {
      const banners = await db.collection("banners").find({}).toArray();
      res.json(banners);
    } catch (error) {
      console.error("❌ Lỗi khi lấy banners:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  } else {
    res.status(405).json({ error: "Method không được hỗ trợ!" });
  }
}
