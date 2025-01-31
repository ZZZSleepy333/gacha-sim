import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { MongoClient } from "mongodb";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

//const multer = require("multer");

cloudinary.config({
  cloud_name: "dhdhxoqxs",
  api_key: 224474966178738,
  api_secret: "eBDr5tU0_CyUI2pc5Kn8OGmDEmQ",
});

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json()); // ✅ Fix lỗi req.body undefined
app.use(express.urlencoded({ extended: true }));

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "banners", // Tạo folder trong Cloudinary
    format: async (req, file) => "png", // Chuyển thành PNG
    public_id: (req, file) => file.originalname.split(".")[0], // Dùng tên file làm ID
  },
});

const upload = multer({ storage: storage });

// Kết nối MongoDB
const MONGO_URI =
  "mongodb+srv://namnguyenhoang0903:01202902494@cluster0.su7jf.mongodb.net/";
const DB_NAME = "banner_db";
const COLLECTION_NAME = "characters";

let db, charactersCollection;
MongoClient.connect(MONGO_URI, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
})
  .then((client) => {
    db = client.db(DB_NAME);
    charactersCollection = db.collection(COLLECTION_NAME);
    console.log("🔗 Đã kết nối MongoDB!");
  })
  .catch((error) => console.error("❌ Lỗi kết nối MongoDB:", error));

// Hàm crawl dữ liệu từ website
const crawlCharacters = async () => {
  try {
    const url = "https://housamo-skill.netlify.app/charas/"; // Thay đổi URL nếu cần
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const characters = [];

    $("#chara-list li").each((_, element) => {
      const $el = $(element);
      const name = $el.find("a").text().trim();
      const href = $el.find("a").attr("href");
      const rarity = $el.attr("data-rarity");
      const imgSrc = $el.find("img").attr("src");

      // Xử lý tags
      let tags = [];
      if (name.includes("Standard")) tags.push("Normal");
      else tags.push("Limited");

      if (!name.includes("(")) tags.push("New");

      characters.push({
        name,
        href,
        rarity: parseInt(rarity, 10),
        imgSrc,
        tags,
      });
    });

    return characters;
  } catch (error) {
    console.error("❌ Lỗi khi crawl dữ liệu:", error);
    return [];
  }
};

app.get("/api/characters", async (req, res) => {
  try {
    const count = await charactersCollection.countDocuments();
    if (count === 0) {
      console.log("⚡ Dữ liệu trống, tiến hành crawl...");
      const newCharacters = await crawlCharacters();
      if (newCharacters.length > 0) {
        await charactersCollection.insertMany(newCharacters);
        console.log("✅ Đã lưu ${newCharacters.length} nhân vật vào MongoDB!");
      }
    }
    const characters = await charactersCollection.find().toArray();
    res.json(characters);
  } catch (error) {
    console.error("❌ Lỗi lấy dữ liệu MongoDB:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// API lấy danh sách nhân vật từ MongoDB
app.post("/api/banners", upload.single("image"), async (req, res) => {
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
      return res.status(400).json({ error: "Dữ liệu nhân vật không hợp lệ!" });
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
});

app.post("/api/banners", upload.single("image"), async (req, res) => {
  try {
    const { name, characters } = req.body;
    if (!name || !characters || characters.length === 0) {
      return res
        .status(400)
        .json({ error: "Tên và danh sách nhân vật là bắt buộc!" });
    }

    let imageUrl = req.file ? req.file.path : null; // ✅ Lấy URL ảnh từ Cloudinary

    const result = await db
      .collection("banners")
      .insertOne({ name, characters, imageUrl });
    res.json({ message: "Banner đã lưu!", id: result.insertedId, imageUrl });
  } catch (error) {
    console.error("❌ Lỗi khi lưu banner:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.get("/api/get_banners", async (req, res) => {
  try {
    const banners = await db.collection("banners").find({}).toArray();
    res.json(banners);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách banners:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.listen(PORT, () =>
  console.log("🚀 Server chạy tại http://localhost:${PORT}")
);
