export const getBooks = async () => {
  const res = await fetch("/api/books");
  return res.json();
};

export const getBook = async (bookUid) => {
  const res = await fetch(`/api/books/${bookUid}/detail`);
  return res.json();
};

export const createBook = async (data) => {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("author", data.author);

  // 텍스트 데이터만 따로 JSON으로 보냄
  const textPages = data.pages.map((p) => ({ text: p.text }));
  formData.append("pages", JSON.stringify(textPages));

  // 커버 이미지
  if (data.cover) {
    formData.append("cover", data.cover);
  }

  // 각 페이지 이미지 파일 (수정됨)
  // 서버에서 req.files로 받기 위해 'images'라는 동일한 이름으로 여러 번 append
  data.pages.forEach((page) => {
    if (page.file) {
      formData.append("images", page.file);
    } else {
      // 사진이 없는 페이지임을 알리기 위해 'null' 문자열 전송 (서버 로직에 맞춤)
      formData.append("images", "null");
    }
  });

  const res = await fetch("/api/books", {
    method: "POST",
    body: formData,
  });

  return res.json();
};

export const deleteBook = async (bookUid) => {
  await fetch(`/api/books/${bookUid}`, { method: "DELETE" });
};

export const orderBook = async (bookUid) => {
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_uid: bookUid }),
  });
};
