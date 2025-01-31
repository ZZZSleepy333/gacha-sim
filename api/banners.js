import { MongoClient } from "mongodb";
import formidable from "formidable";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "banners", // Tạo folder trong Cloudinary
    format: async (req, file) => "png", // Chuyển thành PNG
    public_id: (req, file) => file.originalname.split(".")[0], // Dùng tên file làm ID
  },
});

const upload = multer({ storage: storage });

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
    upload.single("image");
    try {
      const { name, characters } = req.body;
      if (!name || !characters) {
        return res
          .status(400)
          .json({ error: "Tên và danh sách nhân vật là bắt buộc!" });
      }

      let parsedCharacters;
      try {
        parsedCharacters = JSON.parse(characters); // Chuyển JSON string thành object
      } catch (err) {
        return res
          .status(400)
          .json({ error: "Dữ liệu nhân vật không hợp lệ!" });
      }

      let imageUrl = req.file ? req.file.path : null; // ✅ Lấy URL ảnh từ Cloudinary

      const result = await db.collection("banners").insertOne({
        name,
        characters: parsedCharacters, // ✅ Lưu toàn bộ thông tin nhân vật
        imageUrl,
      });

      res.json({ message: "Banner đã lưu!", id: result.insertedId, imageUrl });
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
