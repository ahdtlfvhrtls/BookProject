const SWEETBOOK_API_URL = "https://api-sandbox.sweetbook.com/v1";
const API_KEY = import.meta.env.VITE_SWEETBOOK_API_KEY;
console.log("실제 호출되는 키:", API_KEY);

// 1. 공통 헤더 설정
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// 주문 취소
export const cancelOrder = async (orderUid) => {
  const res = await fetch(`/api/proxy/orders/${orderUid}/cancel`, {
    method: "POST",
  });
  return res.json();
};

// 주문 상세 조회
export const getOrderDetail = async (orderUid) => {
  const res = await fetch(`/api/proxy/orders/${orderUid}`);
  return res.json();
};

export const getOrders = async (limit = 10) => {
  const res = await fetch(`/api/proxy/orders?limit=${limit}`); // 주소 오타 체크
  return res.json();
};

// 로컬 서버 API
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

  const textPages = data.pages.map((p) => ({ text: p.text }));
  formData.append("pages", JSON.stringify(textPages));

  if (data.cover) {
    formData.append("cover", data.cover);
  }

  data.pages.forEach((page) => {
    if (page.file) {
      formData.append("images", page.file);
    } else {
      formData.append("images", "null");
    }
  });

  const res = await fetch("/api/books", {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const updateBook = async (bookUid, data) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("author", data.author);

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
      formData.append(`images_${idx}`, page.file);
    }
  });

  const res = await fetch(`/api/books/${bookUid}`, {
    method: "PUT",
    body: formData,
  });
  return res.json();
};

export const deleteBook = async (bookUid) => {
  const res = await fetch(`/api/books/${bookUid}`, {
    method: "DELETE",
  });
  return res.json();
};

// [Sweetbook 외부 API] - 실제 주문 관련
// 견적 조회
export const estimateOrder = async (bookUid, quantity = 1) => {
  const res = await fetch("/api/proxy/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ bookUid, quantity }] }),
  });
  return res.json();
};

// 실제 주문
export const createOrder = async (orderData) => {
  const res = await fetch("/api/proxy/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  return res.json();
};
