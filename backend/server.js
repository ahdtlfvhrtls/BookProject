import express from "express";
import mysql from "mysql2";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// DB
const db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "1234",
  database: "book_app",
});

// 🔥 핵심 API
app.post("/api/books", upload.array("images"), async (req, res) => {
  try {
    console.log("🔥 시작");

    const { title, author, pages } = req.body;
    const parsedPages = JSON.parse(pages);

    /** =====================
     * 1️⃣ 책 생성
     ====================== */
    console.log("1️⃣ 책 생성");

    const bookRes = await axios.post(
      "https://api-sandbox.sweetbook.com/v1/books",
      {
        title,
        bookSpecUid: "SQUAREBOOK_HC",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
        },
      },
    );

    const bookUid = bookRes.data.data.bookUid;
    console.log("bookUid:", bookUid);

    /** =====================
     * 2️⃣ 사진 업로드
     ====================== */
    console.log("2️⃣ 사진 업로드");

    const uploadedPhotos = [];

    for (const file of req.files) {
      const form = new FormData();
      form.append("file", fs.createReadStream(file.path));

      const uploadRes = await axios.post(
        `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/photos`,
        form,
        {
          headers: {
            Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
            ...form.getHeaders(),
          },
        },
      );

      uploadedPhotos.push(uploadRes.data.data.fileName);
    }

    console.log("업로드된 사진:", uploadedPhotos);

    /** =====================
     * 3️⃣ 표지
     ====================== */
    console.log("3️⃣ 표지");

    const coverForm = new FormData();
    coverForm.append("templateUid", "79yjMH3qRPly");
    coverForm.append(
      "parameters",
      JSON.stringify({
        title,
        coverPhoto: uploadedPhotos[0],
        dateRange: "2026.04",
      }),
    );

    await axios.post(
      `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/cover`,
      coverForm,
      {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          ...coverForm.getHeaders(),
        },
      },
    );

    /** =====================
     * 4️⃣ 간지
     ====================== */
    console.log("4️⃣ 간지");

    await axios.post(
      `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/contents?breakBefore=page`,
      {
        templateUid: "5M3oo7GlWKGO",
        parameters: {
          chapterNum: "01",
          year: "2026",
          monthTitle: "4월의 기록",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
        },
      },
    );

    /** =====================
     * 5️⃣ 내지 (페이지 채우기)
     ====================== */
    console.log("5️⃣ 내지");

    let pageCount = 0;

    while (pageCount < 22) {
      // A
      await axios.post(
        `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/contents`,
        {
          templateUid: "46VqZhVNOfAp",
          parameters: {
            monthNum: "04",
            dayNum: String(pageCount + 1).padStart(2, "0"),
            diaryText: parsedPages[pageCount]?.text || "내용",
            photo: uploadedPhotos[pageCount % uploadedPhotos.length],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          },
        },
      );

      pageCount++;
      if (pageCount >= 22) break;

      // B
      await axios.post(
        `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/contents`,
        {
          templateUid: "5B4ds6i0Rywx",
          parameters: {
            monthNum: "04",
            dayNum: String(pageCount + 1).padStart(2, "0"),
            diaryText: parsedPages[pageCount]?.text || "내용",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          },
        },
      );

      pageCount++;
      if (pageCount >= 22) break;

      // Gallery
      await axios.post(
        `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/contents`,
        {
          templateUid: "6c2HU8tipz1l",
          parameters: {
            monthNum: "04",
            dayNum: String(pageCount + 1).padStart(2, "0"),
            collagePhotos: uploadedPhotos.slice(0, 3),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          },
        },
      );

      pageCount++;
    }

    /** =====================
     * 6️⃣ 발행면
     ====================== */
    console.log("6️⃣ 발행면");

    await axios.post(
      `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/contents?breakBefore=page`,
      {
        templateUid: "5nhOVBjTnIVE",
        parameters: {
          photo: uploadedPhotos[0],
          title,
          publishDate: "2026년 4월 5일",
          author,
          hashtags: "#일기",
          publisher: "My App",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
        },
      },
    );

    /** =====================
     * 7️⃣ finalize
     ====================== */
    console.log("7️⃣ finalize");

    const finalRes = await axios.post(
      `https://api-sandbox.sweetbook.com/v1/books/${bookUid}/finalization`,
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
        },
      },
    );

    console.log("완료:", finalRes.data);

    res.json({ success: true, bookUid });
  } catch (err) {
    console.error("❌ 에러:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: err.message });
  }
});

app.listen(3000, () => console.log("서버 실행 3000"));
