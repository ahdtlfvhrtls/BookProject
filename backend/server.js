import express from "express";
import mysql from "mysql2";
import multer from "multer";
import { SweetbookClient } from "bookprintapi-nodejs-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적 파일
app.use(express.static(path.join(__dirname, "Pront")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// SDK
const client = new SweetbookClient({
  apiKey: process.env.SWEETBOOK_API_KEY,
  environment: "sandbox",
});

// DB
const db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "1234",
  database: "book_app",
});

// 책 생성
app.post("/api/books", upload.array("images"), async (req, res) => {
  try {
    const { title, author, pages } = req.body;
    const parsedPages = JSON.parse(pages);
    const files = req.files;

    // 1. 책 생성
    const book = await client.books.create({
      bookSpecUid: "SQUAREBOOK_HC",
      title,
      creationType: "TEST",
    });

    const bookUid = book.bookUid;

    // 2. 표지
    await client.covers.create(bookUid, "79yjMH3qRPly", {
      coverPhoto: `http://localhost:3000/uploads/${files[0].filename}`,
      title,
      dateRange: "2026.04",
    });

    // 3. 간지 (챕터)
    await client.contents.insert(bookUid, "5M3oo7GlWKGO", {
      chapterNum: "01",
      year: "2026",
      monthTitle: "4월의 기록",
    });

    // 4. 내지 (핵심)
    for (let i = 0; i < parsedPages.length; i++) {
      const page = parsedPages[i];

      const imageUrl = `http://localhost:3000/uploads/${files[i].filename}`;

      await client.contents.insert(bookUid, "46VqZhVNOfAp", {
        monthNum: "04",
        dayNum: String(i + 1).padStart(2, "0"),
        diaryText: page.text,
        photo: imageUrl,
      });
    }

    // 5. 발행면
    await client.contents.insert(bookUid, "5nh0VBjtnIVE", {
      photo: `http://localhost:3000/uploads/${files[0].filename}`,
      title,
      publishDate: "2026년 4월 5일",
      author,
      hashtags: "#일기 #기록",
      publisher: "My App",
    });

    // 6. finalize
    await client.books.finalize(bookUid);

    res.json({ message: "책 생성 완료", bookUid });
  } catch (err) {
    console.error("에러:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// 목록
app.get("/api/books", (req, res) => {
  db.query("SELECT * FROM books ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 상세
app.get("/api/books/:id", (req, res) => {
  db.query("SELECT * FROM books WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

app.listen(3000, () => console.log("서버 실행 3000"));
