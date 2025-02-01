import { MongoClient } from "mongodb";
import axios from "axios";
import * as cheerio from "cheerio";

const MONGO_URI =
  "mongodb+srv://namnguyenhoang0903:01202902494@cluster0.su7jf.mongodb.net/";
const DB_NAME = "banner_db";

let db;

// ✅ Kết nối MongoDB
const connectDB = async () => {
  if (!db) {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
  }
  return db;
};

// ✅ Crawl danh sách nhân vật
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

// ✅ API handler
export default async function handler(req, res) {
  try {
    const db = await connectDB();
    const charactersCollection = db.collection("characters"); // ✅ Lấy collection đúng cách

    // Kiểm tra xem DB có nhân vật nào chưa
    const count = await charactersCollection.countDocuments();
    if (count === 0) {
      const newCharacters = await crawlCharacters();
      if (newCharacters.length > 0) {
        await charactersCollection.insertMany(newCharacters);
      }
    }

    // Lấy danh sách nhân vật
    const characters = await charactersCollection.find().toArray();

    // ✅ Kiểm tra dữ liệu có phải là mảng không
    if (!Array.isArray(characters)) {
      throw new Error("Dữ liệu trả về không phải là mảng!");
    }

    res.json(characters);
  } catch (error) {
    console.error("❌ Lỗi lấy dữ liệu MongoDB:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
