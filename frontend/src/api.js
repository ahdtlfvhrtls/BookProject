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

// 삭제
export const deleteBook = async (bookUid) => {
  const res = await fetch(`/api/books/${bookUid}`, {
    method: "DELETE",
  });
  return res.json(); // 응답 결과를 JSON으로 변환해서 반환해야 함
};

export const orderBook = async (bookUid) => {
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_uid: bookUid }),
  });
};

// 수정
export const updateBook = async (bookUid, data) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("author", data.author);

  // existingImage 정보를 포함해서 보냄
  const textPages = data.pages.map((p) => ({
    text: p.text,
    existingImage: p.image_url || null,
  }));
  formData.append("pages", JSON.stringify(textPages));

  if (data.cover instanceof File) {
    formData.append("cover", data.cover);
  }

  data.pages.forEach((page, idx) => {
    if (page.file) {
      // 어느 페이지의 사진인지 명확히 하기 위해 인덱스 포함
      formData.append(`images_${idx}`, page.file);
    }
  });

  const res = await fetch(`/api/books/${bookUid}`, {
    method: "PUT",
    body: formData,
  });
  return res.json();
};
