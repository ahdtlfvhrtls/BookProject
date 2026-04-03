import express from "express";
import mysql from "mysql2";
import { SweetbookClient } from "bookprintapi-nodejs-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프론트 연결
app.use(express.static(path.join(__dirname, "Pront")));

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
app.post("/api/books", async (req, res) => {
  const { title, author, content } = req.body;

  try {
    // 1. 책 생성
    const book = await client.books.create({
      bookSpecUid: "SQUAREBOOK_HC",
      title,
      creationType: "TEST",
    });

    const bookUid = book.bookUid;

    // 2. 페이지 추가
    await client.contents.insert({
      bookUid: bookUid,
      pages: [
        {
          type: "TEXT",
          text: content,
        },
      ],
    });

    // 3. finalize
    await client.books.finalize(bookUid);

    // 4. DB 저장
    const query = `
      INSERT INTO books (title, author, book_uid, content)
      VALUES (?, ?, ?, ?)
    `;

    db.query(query, [title, author, bookUid, content]);

    res.json({ message: "책 생성 완료", bookUid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 목록 조회 (DB 기준)
app.get("/api/books", (req, res) => {
  db.query("SELECT * FROM books ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 상세 조회
app.get("/api/books/:id", (req, res) => {
  db.query(
    "SELECT * FROM books WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
    },
  );
});

app.listen(3000, () => {
  console.log("서버 실행 3000");
});
