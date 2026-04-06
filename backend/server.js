import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// multer (이미지 업로드)
const upload = multer({ dest: "uploads/" });

// API 기본 설정
const API = "https://api-sandbox.sweetbook.com/v1";
const HEADERS = {
  Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
};

// 🔥 핵심 API
app.post("/api/books", upload.array("images"), async (req, res) => {
  try {
    console.log("🔥 시작");

    const { title, author, pages } = req.body;
    const parsedPages = JSON.parse(pages);

    // 1️⃣ 책 생성
    console.log("1️⃣ 책 생성");
    const bookRes = await axios.post(
      `${API}/books`,
      {
        title,
        bookSpecUid: "SQUAREBOOK_HC",
      },
      { headers: HEADERS },
    );

    const bookUid = bookRes.data.data.bookUid;
    console.log("bookUid:", bookUid);

    // 2️⃣ 사진 업로드
    console.log("2️⃣ 사진 업로드");

    const uploadedPhotos = [];

    for (const file of req.files) {
      const form = new FormData();
      form.append("file", file.buffer, file.originalname);

      const uploadRes = await axios.post(
        `${API}/books/${bookUid}/photos`,
        form,
        {
          headers: {
            ...HEADERS,
            ...form.getHeaders(),
          },
        },
      );

      uploadedPhotos.push(uploadRes.data.data.fileName);
    }

    console.log("업로드된 사진:", uploadedPhotos);

    // 3️⃣ 표지
    console.log("3️⃣ 표지");

    const coverForm = new FormData();
    coverForm.append("templateUid", "79yjMH3qRPly");
    coverForm.append(
      "parameters",
      JSON.stringify({
        title,
        dateRange: "2026.04",
        coverPhoto: uploadedPhotos[0],
      }),
    );

    await axios.post(`${API}/books/${bookUid}/cover`, coverForm, {
      headers: {
        ...HEADERS,
        ...coverForm.getHeaders(),
      },
    });

    // 4️⃣ 간지
    console.log("4️⃣ 간지");

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
      {
        headers: {
          ...HEADERS,
          ...chapterForm.getHeaders(),
        },
      },
    );

    // 5️⃣ 내지 (최소 24페이지 맞추기)
    console.log("5️⃣ 내지");

    let pageCount = 0;

    while (pageCount < 24) {
      // A 타입
      const formA = new FormData();
      formA.append("templateUid", "46VqZhVNOfAp");
      formA.append(
        "parameters",
        JSON.stringify({
          monthNum: "04",
          dayNum: String(pageCount + 1).padStart(2, "0"),
          diaryText: parsedPages[pageCount]?.text || `내용 ${pageCount + 1}`,
          photo: uploadedPhotos[pageCount % uploadedPhotos.length],
        }),
      );

      await axios.post(
        `${API}/books/${bookUid}/contents?breakBefore=page`,
        formA,
        {
          headers: { ...HEADERS, ...formA.getHeaders() },
        },
      );

      pageCount++;
      if (pageCount >= 24) break;

      // B 타입
      const formB = new FormData();
      formB.append("templateUid", "5B4ds6i0Rywx");
      formB.append(
        "parameters",
        JSON.stringify({
          monthNum: "04",
          dayNum: String(pageCount + 1).padStart(2, "0"),
          diaryText: parsedPages[pageCount]?.text || `내용 ${pageCount + 1}`,
        }),
      );

      await axios.post(
        `${API}/books/${bookUid}/contents?breakBefore=page`,
        formB,
        {
          headers: { ...HEADERS, ...formB.getHeaders() },
        },
      );

      pageCount++;
      if (pageCount >= 24) break;

      // Gallery
      const formG = new FormData();
      formG.append("templateUid", "6c2HU8tipz1l");
      formG.append(
        "parameters",
        JSON.stringify({
          monthNum: "04",
          dayNum: String(pageCount + 1).padStart(2, "0"),
          collagePhotos: uploadedPhotos.slice(0, 3),
        }),
      );

      await axios.post(
        `${API}/books/${bookUid}/contents?breakBefore=page`,
        formG,
        {
          headers: { ...HEADERS, ...formG.getHeaders() },
        },
      );

      pageCount++;
    }

    console.log("내지 완료");

    // 6️⃣ 발행면
    console.log("6️⃣ 발행면");

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
      {
        headers: { ...HEADERS, ...publishForm.getHeaders() },
      },
    );

    // 7️⃣ finalize
    console.log("7️⃣ finalize");

    await axios.post(
      `${API}/books/${bookUid}/finalization`,
      {},
      { headers: HEADERS },
    );

    console.log("🎉 완료");

    res.json({ success: true, bookUid });
  } catch (err) {
    console.error("❌ 에러:", err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  }
});

app.listen(3000, () => console.log("서버 실행 3000"));
