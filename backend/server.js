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

// 프론트 연결
app.use(express.static(path.join(__dirname, "Pront")));

// ✅ SDK 초기화
const client = new SweetbookClient({
  apiKey: process.env.SWEETBOOK_API_KEY,
  environment: "sandbox",
});

// DB 연결
let db;

function connectWithRetry() {
  db = mysql.createConnection({
    host: "db",
    user: "root",
    password: "1234",
    database: "book_app",
  });

  db.connect((err) => {
    if (err) {
      console.log("❌ DB 연결 실패, 3초 후 재시도...");
      setTimeout(connectWithRetry, 3000);
    } else {
      console.log("✅ DB 연결 성공");
    }
  });
}

connectWithRetry();

// ✅ 책 생성 + 주문
app.post("/api/order", async (req, res) => {
  try {
    // 1. 책 생성
    const book = await client.books.create({
      bookSpecUid: "SQUAREBOOK_HC",
      title: req.body.title || "나만의 책",
      creationType: "TEST",
    });

    // 2. finalize
    await client.books.finalize(book.bookUid);

    // 3. 주문 생성
    const order = await client.orders.create({
      bookUid: book.bookUid,
      recipient: {
        name: req.body.name || "홍길동",
        phone: "01012345678",
        address1: "서울",
        address2: "상세주소",
        zipCode: "12345",
      },
    });

    // 4. DB 저장
    db.query("INSERT INTO orders (book_uid, status) VALUES (?, ?)", [
      book.bookUid,
      "CREATED",
    ]);

    res.json({
      message: "주문 완료",
      bookUid: book.bookUid,
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "주문 실패" });
  }
});

// 주문 목록
app.get("/api/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 기본 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Pront", "index.html"));
});

// 실행
app.listen(3000, () => {
  console.log("🚀 서버 실행: http://localhost:3000");
});
