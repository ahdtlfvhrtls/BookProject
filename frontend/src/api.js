export const getBooks = async () => {
  const res = await fetch("/api/books");
  return res.json();
};

export const getBook = async (id) => {
  const res = await fetch(`/api/books/${id}`);
  return res.json();
};

export const createBook = async (data) => {
  await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const deleteBook = async (id) => {
  await fetch(`/api/books/${id}`, { method: "DELETE" });
};

export const orderBook = async (book_uid) => {
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_uid }),
  });
};
