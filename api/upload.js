import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import nextConnect from "next-connect";

cloudinary.config({
  cloud_name: "dhdhxoqxs",
  api_key: "224474966178738",
  api_secret: "eBDr5tU0_CyUI2pc5Kn8OGmDEmQ",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banners",
    format: async () => "png",
    public_id: (req, file) => file.originalname.split(".")[0],
  },
});

const upload = multer({ storage });

const handler = nextConnect();
handler.use(upload.single("image"));

handler.post((req, res) => {
  res.json({ imageUrl: req.file.path });
});

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
