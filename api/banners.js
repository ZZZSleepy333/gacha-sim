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
  const db = await connectDB();

  if (req.method === "POST") {
    try {
      const { name, characters } = req.body;
      if (!name || !characters) {
        return res
          .status(400)
          .json({ error: "Tên và danh sách nhân vật là bắt buộc!" });
      }
      const result = await db.collection("banners").insertOne({
        name,
        characters: JSON.parse(characters),
      });
      res.json({ message: "Banner đã lưu!", id: result.insertedId });
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
