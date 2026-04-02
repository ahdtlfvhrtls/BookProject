import express from "express";
import mysql from "mysql2";

const app = express();

const db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "1234",
  database: "book_app",
});

// 연결 재시도 로직 백엔드가 DB가 준비될 때까지 기다리도록 함
function connectWithRetry() {
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

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
