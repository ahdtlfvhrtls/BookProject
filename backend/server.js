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

// multer
const upload = multer({ storage: multer.memoryStorage() });

// DB pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "book_app",
});

// SweetBook API
const API = "https://api-sandbox.sweetbook.com/v1";
const HEADERS = {
  Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
};

// uploads 폴더 생성 (책 페이지 이미지 저장용)
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// 예: book_pages.image_url에 저장된 파일명을 로컬에서 제공
app.get("/uploads/:filename", async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.sendFile(filePath);
});

// 1. 책 생성 (SweetBook + DB 저장)
app.post("/api/books", upload.any(), async (req, res) => {
  let conn;

  try {
    const { title, author, pages } = req.body;
    const parsedPages = JSON.parse(pages);

    console.log("🔥 시작");

    // 1️. 책 생성
    const bookRes = await axios.post(
      `${API}/books`,
      { title, bookSpecUid: "SQUAREBOOK_HC" },
      { headers: HEADERS },
    );

    const bookUid = bookRes.data.data.bookUid;

    // 2️. 이미지 업로드 + 로컬 저장
    const coverFile = req.files.find((f) => f.fieldname === "cover");
    const pageFiles = req.files.filter((f) => f.fieldname === "images");

    const uploadImage = async (file) => {
      // SweetBook 업로드
      const form = new FormData();
      form.append("file", file.buffer, file.originalname);

      const res = await axios.post(`${API}/books/${bookUid}/photos`, form, {
        headers: { ...HEADERS, ...form.getHeaders() },
      });

      const fileName = res.data.data.fileName;

      // 로컬 저장
      fs.writeFileSync(path.join(UPLOAD_DIR, fileName), file.buffer);

      return fileName;
    };

    // cover
    const coverFileName = coverFile ? await uploadImage(coverFile) : null;

    // pages
    const uploadedPhotos = [];
    for (const file of pageFiles) {
      const name = await uploadImage(file);
      uploadedPhotos.push(name);
    }

    if (!coverFileName && uploadedPhotos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "이미지 최소 1개 필요",
      });
    }

    // 3️. 표지
    const coverForm = new FormData();
    coverForm.append("templateUid", "79yjMH3qRPly");
    coverForm.append(
      "parameters",
      JSON.stringify({
        title,
        dateRange: "2026.04",
        coverPhoto: coverFileName || uploadedPhotos[0],
      }),
    );

    await axios.post(`${API}/books/${bookUid}/cover`, coverForm, {
      headers: { ...HEADERS, ...coverForm.getHeaders() },
    });

    // 4️. 간지
    const chapterForm = new FormData();
    chapterForm.append("templateUid", "5M3oo7GlWKGO");
    chapterForm.append(
      "parameters",
      JSON.stringify({
        chapterNum: "01",
        year: "2026",
        monthTitle: "4월의 기록",
      }),
    );

    await axios.post(
      `${API}/books/${bookUid}/contents?breakBefore=page`,
      chapterForm,
      { headers: { ...HEADERS, ...chapterForm.getHeaders() } },
    );

    // 5️. 내지
    let pageCount = 0;

    while (pageCount < 24) {
      const text = parsedPages[pageCount]?.text || `내용 ${pageCount + 1}`;
      const photo = uploadedPhotos[pageCount % uploadedPhotos.length];

      const form = new FormData();
      form.append("templateUid", "46VqZhVNOfAp");
      form.append(
        "parameters",
        JSON.stringify({
          monthNum: "04",
          dayNum: String(pageCount + 1).padStart(2, "0"),
          diaryText: text,
          photo,
        }),
      );

      await axios.post(
        `${API}/books/${bookUid}/contents?breakBefore=page`,
        form,
        { headers: { ...HEADERS, ...form.getHeaders() } },
      );

      pageCount++;
    }

    // 6️. 발행면
    const publishForm = new FormData();
    publishForm.append("templateUid", "5nhOVBjTnIVE");
    publishForm.append(
      "parameters",
      JSON.stringify({
        photo: uploadedPhotos[0],
        title,
        publishDate: "2026년 4월 5일",
        author,
        hashtags: "#일기 #기록",
        publisher: "My App",
      }),
    );

    await axios.post(
      `${API}/books/${bookUid}/contents?breakBefore=page`,
      publishForm,
      { headers: { ...HEADERS, ...publishForm.getHeaders() } },
    );

    // 7. finalize
    await axios.post(
      `${API}/books/${bookUid}/finalization`,
      {},
      { headers: HEADERS },
    );

    console.log("🎉 SweetBook 완료");

    // DB 저장
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO books (book_uid, title, author, cover_image)
       VALUES (?, ?, ?, ?)`,
      [bookUid, title, author, coverFileName || uploadedPhotos[0]],
    );

    const values = parsedPages.map((page, i) => [
      bookUid,
      i + 1,
      page.text || null,
      uploadedPhotos[i] || null,
    ]);

    await conn.query(
      `INSERT INTO book_pages (book_uid, page_number, text, image_url)
       VALUES ?`,
      [values],
    );

    await conn.commit();

    res.json({ success: true, bookUid });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  } finally {
    if (conn) conn.release();
  }
});

// 2. 책 조회 (DB 기준)
app.get("/api/books/:bookUid/detail", async (req, res) => {
  const { bookUid } = req.params;

  try {
    const [book] = await pool.query(
      `SELECT * FROM books WHERE book_uid = ? AND deleted_at IS NULL`,
      [bookUid],
    );

    if (book.length === 0) {
      return res.status(404).json({ error: "not found" });
    }

    const [pages] = await pool.query(
      `SELECT page_number, text, image_url
       FROM book_pages
       WHERE book_uid = ?
       ORDER BY page_number`,
      [bookUid],
    );

    const [orders] = await pool.query(
      `SELECT id, status FROM orders WHERE book_uid = ?`,
      [bookUid],
    );

    res.json({
      book: book[0],
      pages,
      orders,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// 3. 주문 생성
app.post("/api/orders", async (req, res) => {
  const { book_uid, buyer_name, buyer_email, address, phone } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [order] = await conn.query(
      `INSERT INTO orders (book_uid, buyer_name, buyer_email, status)
       VALUES (?, ?, ?, 'PENDING')`,
      [book_uid, buyer_name, buyer_email],
    );

    await conn.query(
      `INSERT INTO deliveries (order_id, address, recipient_name, phone)
       VALUES (?, ?, ?, ?)`,
      [order.insertId, address, buyer_name, phone],
    );

    await conn.commit();

    res.json({ success: true, orderId: order.insertId });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json(err.message);
  } finally {
    if (conn) conn.release();
  }
});

// 4. 주문 상세 조회
app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [order] = await pool.query(
      `SELECT o.id, o.status, o.created_at,
              b.title, b.author
       FROM orders o
       JOIN books b ON o.book_uid = b.book_uid
       WHERE o.id = ?`,
      [id],
    );

    const [delivery] = await pool.query(
      `SELECT address, recipient_name, phone
       FROM deliveries WHERE order_id = ?`,
      [id],
    );

    res.json({
      order: order[0],
      delivery: delivery[0],
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// 5. 주문 목록
app.get("/api/orders", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.status, o.created_at,
              b.title, b.author
       FROM orders o
       JOIN books b ON o.book_uid = b.book_uid
       ORDER BY o.created_at DESC`,
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// 6. 책 수정 (기존 책을 복제 + 새로 생성 방식)
app.post("/api/books/:bookUid/remake", async (req, res) => {
  const { bookUid } = req.params;

  try {
    const [bookRows] = await pool.query(
      `SELECT * FROM books WHERE book_uid = ?`,
      [bookUid],
    );

    if (bookRows.length === 0) {
      return res.status(404).json({ error: "book not found" });
    }

    const [pages] = await pool.query(
      `SELECT text FROM book_pages WHERE book_uid = ? ORDER BY page_number`,
      [bookUid],
    );

    const originalBook = bookRows[0];

    const newTitle = req.body.title || originalBook.title;
    const newAuthor = req.body.author || originalBook.author;

    const newPages = req.body.pages || pages.map((p) => ({ text: p.text }));

    const response = await axios.post("http://localhost:3000/api/books", {
      title: newTitle,
      author: newAuthor,
      pages: JSON.stringify(newPages),
    });

    const newBookUid = response.data.bookUid;

    await pool.query(`UPDATE books SET deleted_at = NOW() WHERE book_uid = ?`, [
      bookUid,
    ]);

    res.json({
      success: true,
      newBookUid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err.message);
  }
});

// 7. 책 삭제 (Soft Delete)
app.delete("/api/books/:bookUid", async (req, res) => {
  const { bookUid } = req.params;

  try {
    await pool.query(`UPDATE books SET deleted_at = NOW() WHERE book_uid = ?`, [
      bookUid,
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// 전체 책 조회
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM books WHERE deleted_at IS NULL ORDER BY created_at DESC",
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err.message);
  }
});

app.listen(3000, () => console.log("🚀 서버 실행 3000"));
