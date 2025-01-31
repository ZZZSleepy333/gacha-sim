import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { MongoClient } from "mongodb";
import cors from "cors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const app = express();

// Sử dụng biến môi trường
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://namnguyenhoang0903:01202902494@cluster0.su7jf.mongodb.net/";
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dhdhxoqxs";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "224474966178738";
const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || "eBDr5tU0_CyUI2pc5Kn8OGmDEmQ";

// Cloudinary config
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "banners",
    format: async () => "png",
    public_id: (req, file) => file.originalname.split(".")[0],
  },
});

const upload = multer({ storage: storage });

// MongoDB connection
let db, charactersCollection;
async function connectDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    db = client.db("banner_db");
    charactersCollection = db.collection("characters");
    console.log("🔗 Connected to MongoDB!");
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

// Routes
app.get("/api/characters", async (req, res) => {
  try {
    if (!db) await connectDB();

    const count = await charactersCollection.countDocuments();
    if (count === 0) {
      console.log("⚡ Empty database, crawling data...");
      const newCharacters = await crawlCharacters();
      if (newCharacters.length > 0) {
        await charactersCollection.insertMany(newCharacters);
        console.log(`✅ Saved ${newCharacters.length} characters to MongoDB!`);
      }
    }
    const characters = await charactersCollection.find().toArray();
    res.json(characters);
  } catch (error) {
    console.error("❌ Error fetching data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/banners", upload.single("image"), async (req, res) => {
  try {
    if (!db) await connectDB();

    const { name, characters } = req.body;
    if (!name || !characters) {
      return res
        .status(400)
        .json({ error: "Name and character list are required!" });
    }

    let parsedCharacters;
    try {
      parsedCharacters =
        typeof characters === "string" ? JSON.parse(characters) : characters;
    } catch (err) {
      return res.status(400).json({ error: "Invalid character data!" });
    }

    const imageUrl = req.file?.path || null;

    const result = await db.collection("banners").insertOne({
      name,
      characters: parsedCharacters,
      imageUrl,
      createdAt: new Date(),
    });

    res.json({ message: "Banner saved!", id: result.insertedId, imageUrl });
  } catch (error) {
    console.error("❌ Error saving banner:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/get_banners", async (req, res) => {
  try {
    if (!db) await connectDB();

    const banners = await db
      .collection("banners")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.json(banners);
  } catch (error) {
    console.error("❌ Error fetching banners:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Crawling function
async function crawlCharacters() {
  try {
    const url = "https://housamo-skill.netlify.app/charas/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const characters = [];

    $("#chara-list li").each((_, element) => {
      const $el = $(element);
      const name = $el.find("a").text().trim();
      const href = $el.find("a").attr("href");
      const rarity = $el.attr("data-rarity");
      const imgSrc = $el.find("img").attr("src");

      const tags = [];
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
    console.error("❌ Error crawling data:", error);
    return [];
  }
}

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  );
}

// For Vercel
export default app;
