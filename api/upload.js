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

export default async function handler(req, res) {
  console.log("📥 Nhận request:", req.method);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Chỉ hỗ trợ phương thức POST!" });
  }

  try {
    console.log("🛠️ Kết nối database...");
    const db = await connectDB();

    console.log("📤 Xử lý FormData...");
    upload.single("image")(req, res, async (err) => {
      if (err) {
        console.error("❌ Lỗi upload hình ảnh:", err);
        return res.status(500).json({ error: "Lỗi upload hình ảnh" });
      }

      console.log("✅ FormData xử lý thành công!", req.body);

      const { name, characters } = req.body;
      if (!name || !characters) {
        console.error("❌ Thiếu dữ liệu!", { name, characters });
        return res
          .status(400)
          .json({ error: "Tên và danh sách nhân vật là bắt buộc!" });
      }

      let parsedCharacters;
      try {
        parsedCharacters = JSON.parse(characters);
      } catch (err) {
        console.error("❌ Dữ liệu nhân vật không hợp lệ!", characters);
        return res
          .status(400)
          .json({ error: "Dữ liệu nhân vật không hợp lệ!" });
      }

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

        //return res.json({ message: "Upload thành công!", fields, files });
      });
      try {
        const result = await db.collection("banners").insertOne({
          name,
          characters: parsedCharacters,
          files,
        });

        console.log("✅ Banner đã lưu!", result.insertedId);

        res.json({
          message: "Banner đã lưu!",
          id: result.insertedId,
          files,
        });
      } catch (dbError) {
        console.error("❌ Lỗi khi lưu vào MongoDB:", dbError);
        res.status(500).json({ error: "Lỗi khi lưu vào MongoDB" });
      }
    });
  } catch (error) {
    console.error("❌ Lỗi server:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
