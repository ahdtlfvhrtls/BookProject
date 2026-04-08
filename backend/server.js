import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json());
// [정적 파일] 사용자가 올린 사진이나 기본 이미지를 프론트에서 볼 수 있게 함
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const upload = multer({ storage: multer.memoryStorage() });

// DB 연결 (한국 시간대 설정)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "book_app",
  timezone: "+09:00",
  connectionLimit: 10,
});

const API = "https://api-sandbox.sweetbook.com/v1";
const HEADERS = { Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}` };

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ASSETS_DIR = path.join(process.cwd(), "assets");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Sweetbook API 호출용 헬퍼
async function addContent(bookUid, templateUid, parameters, file = null) {
  const form = new FormData();
  form.append("templateUid", templateUid);
  if (file) {
    form.append(
      "photo",
      file.buffer || file,
      file.originalname || "default.jpg",
    );
    parameters.photo = "$upload";
  }
  form.append("parameters", JSON.stringify(parameters));
  return axios.post(`${API}/books/${bookUid}/contents?breakBefore=page`, form, {
    headers: { ...HEADERS, ...form.getHeaders() },
  });
}

// --- 여기서부터 API 라우터 (생략 없음) ---

/**
 * 1. 책 목록 조회 (GET /api/books)
 */
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error("목록 조회 실패:", err);
    res.status(500).json([]);
  }
});

/**
 * 2. 책 상세 정보 조회 (GET /api/books/:bookUid/detail)
 */
app.get("/api/books/:bookUid/detail", async (req, res) => {
  const { bookUid } = req.params;
  try {
    const [book] = await pool.query("SELECT * FROM books WHERE book_uid = ?", [
      bookUid,
    ]);
    const [pages] = await pool.query(
      "SELECT * FROM book_pages WHERE book_uid = ? ORDER BY page_number",
      [bookUid],
    );

    if (book.length === 0) {
      return res.status(404).json({ message: "데이터가 없습니다." });
    }
    res.json({ book: book[0], pages });
  } catch (err) {
    console.error("상세 조회 실패:", err);
    res.status(500).json(err.message);
  }
});

/**
 * 3. 책 생성 (POST /api/books)
 */
app.post("/api/books", upload.any(), async (req, res) => {
  let conn;
  try {
    const { title, author, pages } = req.body;
    const parsedPages = pages ? JSON.parse(pages) : [];

    console.log("🚀 책 생성 시작...");

    const bookRes = await axios.post(
      `${API}/books`,
      { title, bookSpecUid: "SQUAREBOOK_HC" },
      { headers: HEADERS },
    );
    const bookUid = bookRes.data.data.bookUid;

    const coverFile = req.files.find((f) => f.fieldname === "cover");
    const pageFiles = req.files.filter((f) => f.fieldname === "images");

    const defaultImagePath = path.join(ASSETS_DIR, "default.jpg");
    const defaultImageBuffer = fs.existsSync(defaultImagePath)
      ? fs.readFileSync(defaultImagePath)
      : null;

    // 표지
    const coverPhoto =
      coverFile ||
      (pageFiles.length > 0
        ? pageFiles[0]
        : { buffer: defaultImageBuffer, originalname: "default.jpg" });
    const coverForm = new FormData();
    coverForm.append("templateUid", "79yjMH3qRPly");
    coverForm.append(
      "coverPhoto",
      coverPhoto.buffer,
      coverPhoto.originalname || "cover.jpg",
    );
    coverForm.append(
      "parameters",
      JSON.stringify({ title, dateRange: "2026.04", coverPhoto: "$upload" }),
    );
    await axios.post(`${API}/books/${bookUid}/cover`, coverForm, {
      headers: { ...HEADERS, ...coverForm.getHeaders() },
    });

    // 내지 (최소 26장 강제 채우기)
    for (let i = 0; i < 26; i++) {
      const text = parsedPages[i]?.text || " ";
      let photo = pageFiles[i] ||
        pageFiles[0] || {
          buffer: defaultImageBuffer,
          originalname: "default.jpg",
        };
      await addContent(
        bookUid,
        "46VqZhVNOfAp",
        {
          monthNum: "04",
          dayNum: String(i + 1).padStart(2, "0"),
          diaryText: text,
        },
        photo,
      );
      console.log(`✅ 내지 ${i + 1}/26 완료`);
    }

    await axios.post(
      `${API}/books/${bookUid}/finalization`,
      {},
      { headers: HEADERS },
    );

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const localCover = coverFile ? `${Date.now()}_cover.jpg` : "default.jpg";
    if (coverFile)
      fs.writeFileSync(path.join(UPLOAD_DIR, localCover), coverFile.buffer);

    await conn.query(
      "INSERT INTO books (book_uid, title, author, cover_image) VALUES (?, ?, ?, ?)",
      [bookUid, title, author, localCover],
    );

    if (parsedPages.length > 0) {
      const pageValues = parsedPages.map((p, idx) => {
        let pageImg = null;
        if (pageFiles[idx]) {
          pageImg = `${Date.now()}_page_${idx}.jpg`;
          fs.writeFileSync(
            path.join(UPLOAD_DIR, pageImg),
            pageFiles[idx].buffer,
          );
        }
        return [bookUid, idx + 1, p.text, pageImg];
      });
      await conn.query(
        "INSERT INTO book_pages (book_uid, page_number, text, image_url) VALUES ?",
        [pageValues],
      );
    }

    await conn.commit();
    res.json({ success: true, bookUid });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("❌ 생성 에러:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * 4. 주문 (POST /api/orders)
 */
app.post("/api/orders", async (req, res) => {
  const { book_uid } = req.body;
  try {
    await pool.query(
      "INSERT INTO orders (book_uid, status) VALUES (?, 'PENDING')",
      [book_uid],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/**
 * 5. 삭제 (DELETE /api/books/:bookUid)
 */
app.delete("/api/books/:bookUid", async (req, res) => {
  const { bookUid } = req.params;
  try {
    // 실제로 지우는 대신 deleted_at 컬럼에 시간을 기록해서 목록에서 안 보이게 함
    const [result] = await pool.query(
      "UPDATE books SET deleted_at = NOW() WHERE book_uid = ?",
      [bookUid],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "책을 찾지 못했습니다." });
    }

    console.log(`🗑️ 책 삭제 완료: ${bookUid}`);
    res.json({ success: true });
  } catch (err) {
    console.error("삭제 실패:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. 책 수정 API (PUT /api/books/:bookUid)
 */
app.put("/api/books/:bookUid", upload.any(), async (req, res) => {
  const { bookUid } = req.params;
  let conn;
  try {
    const { title, author, pages } = req.body;
    const parsedPages = JSON.parse(pages);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. 책 기본 정보(제목, 저자) 업데이트
    await conn.query(
      "UPDATE books SET title = ?, author = ? WHERE book_uid = ?",
      [title, author, bookUid],
    );

    // 2. 기존 페이지 DB 데이터 삭제 (새로 다시 넣는게 안 꼬이고 제일 깔끔함)
    await conn.query("DELETE FROM book_pages WHERE book_uid = ?", [bookUid]);

    // 3. 페이지 이미지 처리 및 데이터 삽입
    const pageFiles = req.files.filter((f) => f.fieldname === "images");

    // 파일 업로드 카운터 (새로 업로드된 파일만 순서대로 꺼내기 위함)
    let fileIdx = 0;

    const pageValues = parsedPages.map((p, idx) => {
      let finalImg = p.existingImage; // 새로 안 올렸으면 기존 파일명 유지

      // 만약 해당 순서에 새로 올린 파일이 있다면 교체
      if (req.files.find((f) => f.fieldname === `images_${idx}`)) {
        const file = req.files.find((f) => f.fieldname === `images_${idx}`);
        finalImg = `${Date.now()}_page_${idx}.jpg`;
        fs.writeFileSync(path.join(UPLOAD_DIR, finalImg), file.buffer);
      } else if (pageFiles[fileIdx] && p.file) {
        // 기존 api.js 방식 호환용
        finalImg = `${Date.now()}_page_${idx}.jpg`;
        fs.writeFileSync(
          path.join(UPLOAD_DIR, finalImg),
          pageFiles[fileIdx].buffer,
        );
        fileIdx++;
      }

      return [bookUid, idx + 1, p.text, finalImg];
    });

    await conn.query(
      "INSERT INTO book_pages (book_uid, page_number, text, image_url) VALUES ?",
      [pageValues],
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("수정 에러:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// 주문 견적 프록시
app.post("/api/proxy/estimate", async (req, res) => {
  try {
    const API_KEY = process.env.SWEETBOOK_API_KEY;
    const response = await fetch(
      "https://api-sandbox.sweetbook.com/v1/orders/estimate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      },
    );

    const result = await response.json();
    // Sweetbook의 응답 구조인 { success: true, data: { ... } }를 그대로 프론트에 넘김
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "백엔드 프록시 에러" });
  }
});

// 실제 주문 생성 프록시
app.post("/api/proxy/order", async (req, res) => {
  try {
    const API_KEY = process.env.SWEETBOOK_API_KEY;
    const response = await fetch(
      "https://api-sandbox.sweetbook.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      },
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "주문 처리 중 에러 발생" });
  }
});

// 주문 목록 조회 프록시
app.get("/api/proxy/orders", async (req, res) => {
  try {
    const API_KEY = process.env.SWEETBOOK_API_KEY;
    // 쿼리 파라미터(limit, offset 등)를 그대로 전달
    const queryString = new URLSearchParams(req.query).toString();

    const response = await fetch(
      `https://api-sandbox.sweetbook.com/v1/orders?${queryString}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "주문 목록 로드 실패" });
  }
});

// 주문 취소 프록시
app.post("/api/proxy/orders/:orderUid/cancel", async (req, res) => {
  try {
    const { orderUid } = req.params;
    const response = await fetch(
      `https://api-sandbox.sweetbook.com/v1/orders/${orderUid}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "취소 처리 중 오류 발생" });
  }
});

// 주문 상세 조회 프록시
app.get("/api/proxy/orders/:orderUid", async (req, res) => {
  try {
    const { orderUid } = req.params;
    const API_KEY = process.env.SWEETBOOK_API_KEY;

    console.log("---------------------------------");
    console.log("1. 상세조회 요청 주문번호:", orderUid);
    console.log(
      "2. 사용 중인 API KEY 존재 여부:",
      API_KEY ? "Yes" : "No (체크 필요!)",
    );

    const response = await fetch(
      `https://api-sandbox.sweetbook.com/v1/orders/${orderUid}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    // 이 로그가 터미널에 어떻게 찍히는지 보세요
    console.log(
      "3. Sweetbook 응답 결과:",
      JSON.stringify(result).substring(0, 100) + "...",
    );

    if (result.success) {
      res.json(result);
    } else {
      console.error("4. API 응답 에러 상세:", result.message || result.errors);
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("5. 서버 내부 에러:", error);
    res.status(500).json({ success: false, message: "서버 프록시 오류" });
  }
});

app.listen(3000, () => console.log("🚀 서버 실행 중: 3000"));
