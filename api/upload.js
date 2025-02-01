import multer from "multer";
import { MongoClient } from "mongodb";
import cloudinary from "cloudinary";
import { promisify } from "util";
import fs from "fs";

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

// Cấu hình multer để lưu file tạm thời
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp"); // Thư mục tạm để lưu file
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser để multer xử lý
  },
};

export default async function handler(req, res) {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("❌ Lỗi xử lý upload:", err);
      return res.status(500).json({ error: "Lỗi upload hình ảnh" });
    }

    const { name, characters } = req.body;
    const file = req.file;

    if (!file) {
      console.error("❌ Không tìm thấy file upload");
      return res.status(400).json({ error: "Không tìm thấy file upload" });
    }

    try {
      // Tải lên Cloudinary
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: "banners", // Thư mục trên Cloudinary
      });

      const imageUrl = result.secure_url; // URL của hình ảnh trên Cloudinary

      // Xóa file tạm sau khi upload lên Cloudinary
      await promisify(fs.unlink)(file.path);

      const db = await connectDB();
      const dbResult = await db.collection("banners").insertOne({
        name,
        characters: JSON.parse(characters),
        imageUrl,
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
