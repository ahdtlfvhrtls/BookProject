import express from "express";
import mysql from "mysql2";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

const app = express();
app.use(express.json());

// DB 연결 (재시도 포함)

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

// 가격 계산 로직
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

// 책 목록 조회 (외부 API)
app.get("/api/books", async (req, res) => {
  try {
    const response = await axios.get("https://api.sweetbook.com/books", {
      headers: {
        Authorization: `Bearer YOUR_API_KEY`,
      },
    });

    // 필요한 데이터만 가공
    const books = response.data.map((book) => ({
      id: book.id,
      title: book.title,
      price: book.price,
    }));

    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "외부 API 실패" });
  }
});

// 주문 생성
app.post("/api/order", async (req, res) => {
  const { book_id, options } = req.body;

  try {
    // 외부 API에서 책 정보 조회
    const response = await axios.get(
      `https://api.sweetbook.com/books/${book_id}`,
      {
        headers: {
          Authorization: `Bearer YOUR_API_KEY`,
        },
      },
    );

    const basePrice = response.data.price;

    // 가격 계산
    const total_price = calculatePrice(basePrice, options);

    // 주문 저장
    const orderQuery = `
      INSERT INTO orders (book_id, total_price, status)
      VALUES (?, ?, 'CREATED')
    `;

    db.query(orderQuery, [book_id, total_price], (err, result) => {
      if (err) return res.status(500).json(err);

      const orderId = result.insertId;

      // 옵션 저장
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

// 주문 목록 조회
app.get("/api/orders", (req, res) => {
  db.query("SELECT * FROM orders", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 주문 상세 조회 (JOIN)
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

// 서버 실행
app.listen(3000, () => {
  console.log("포트3000에서 서버 실행 중...");
});
