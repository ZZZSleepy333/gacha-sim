import { MongoClient } from "mongodb";

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
  try {
    const db = await connectDB();
    const characters = await db.collection("characters").find().toArray();
    res.json(characters);
  } catch (error) {
    console.error("❌ Lỗi lấy dữ liệu MongoDB:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
