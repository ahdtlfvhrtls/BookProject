import express from "express";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { SweetbookClient } from "bookprintapi-nodejs-sdk";

dotenv.config();

const app = express();
app.use(express.json());

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 정적 파일
app.use(express.static(path.join(__dirname, "Pront")));

// Sweetbook
const client = new SweetbookClient({
  apiKey: process.env.SWEETBOOK_API_KEY,
  environment: process.env.SWEETBOOK_ENV || "sandbox",
});

// DB 연결
const db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "1234",
  database: "book_app",
});

db.connect(() => console.log("DB 연결 성공"));

// 1. 책 생성 + 내용 저장
app.post("/api/books", async (req, res) => {
  const { title, content } = req.body;

  try {
    const book = await client.books.create({
      bookSpecUid: "SQUAREBOOK_HC",
      title,
      creationType: "TEST",
    });

    // 내용 추가 (핵심)
    await client.contents.insert(book.bookUid, {
      pages: [
        {
          type: "text",
          content,
        },
      ],
    });

    // DB 저장
    db.query(
      "INSERT INTO books (book_uid, title, content) VALUES (?, ?, ?)",
      [book.bookUid, title, content],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "책 생성 완료",
          id: result.insertId,
        });
      },
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "책 생성 실패" });
  }
});

// 2. 책 목록
app.get("/api/books", (req, res) => {
  db.query("SELECT * FROM books", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 3. 책 상세
app.get("/api/books/:id", (req, res) => {
  db.query(
    "SELECT * FROM books WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0]);
    },
  );
});

app.listen(3000, () => {
  console.log("서버 실행 http://localhost:3000");
});
