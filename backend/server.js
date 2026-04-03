import express from "express";
import mysql from "mysql2";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import SweetBook from "bookprintapi-nodejs-sdk";

dotenv.config();

const app = express();
app.use(express.json());

// 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프론트 연결
app.use(express.static(path.join(__dirname, "Pront")));

// ✅ SDK 초기화
const sweetbook = new SweetBook({
  apiKey: process.env.API_KEY,
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

// 가격 계산
const calculatePrice = (basePrice, options = []) => {
  let total = basePrice;

  options.forEach((opt) => {
    if (opt.name === "cover" && opt.value === "hard") {
      total += 5000;
    }
    if (opt.name === "page") {
      total += parseInt(opt.value) * 10;
    }
  });

  return total;
};

// ✅ 책 목록 조회
app.get("/api/books", async (req, res) => {
  try {
    const books = await sweetbook.books.list();

    const result = books.map((book) => ({
      id: book.id,
      title: book.title,
      price: book.price,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "책 조회 실패" });
  }
});

// ✅ 주문 생성
app.post("/api/order", async (req, res) => {
  const { book_id, options } = req.body;

  try {
    const book = await sweetbook.books.get(book_id);

    const total_price = calculatePrice(book.price, options);

    const orderQuery = `
      INSERT INTO orders (book_id, total_price, status)
      VALUES (?, ?, 'CREATED')
    `;

    db.query(orderQuery, [book_id, total_price], (err, result) => {
      if (err) return res.status(500).json(err);

      const orderId = result.insertId;

      if (options && options.length > 0) {
        const optionQuery = `
          INSERT INTO order_options (order_id, option_name, option_value)
          VALUES ?
        `;

        const values = options.map((opt) => [orderId, opt.name, opt.value]);

        db.query(optionQuery, [values]);
      }

      res.json({
        message: "주문 완료",
        orderId,
        total_price,
      });
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

// 주문 상세
app.get("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;

  const query = `
    SELECT o.*, op.option_name, op.option_value
    FROM orders o
    LEFT JOIN order_options op ON o.id = op.order_id
    WHERE o.id = ?
  `;

  db.query(query, [orderId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 실행
app.listen(3000, () => {
  console.log("포트3000에서 서버 실행 중...");
});
