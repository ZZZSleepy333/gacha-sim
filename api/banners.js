import { MongoClient } from "mongodb";
import formidable from "formidable";

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

  try {
    const banners = await db.collection("banners").find({}).toArray();
    res.json(banners);
  } catch (error) {
    console.error("❌ Lỗi khi lấy banners:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
