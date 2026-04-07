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
  formData.append("pages", JSON.stringify(data.pages));

  data.images.forEach((img) => {
    formData.append("images", img);
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
