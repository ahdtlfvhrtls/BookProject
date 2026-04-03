async function createBook() {
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const content = document.getElementById("content").value;

  await fetch("/api/books", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, content }),
  });

  loadBooks();
}

async function loadBooks() {
  const res = await fetch("/api/books");
  const books = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  books.forEach((b) => {
    const div = document.createElement("div");
    div.className = "book";
    div.innerHTML = `<b>${b.title}</b> - ${b.author}`;
    div.onclick = () => showDetail(b.id);
    list.appendChild(div);
  });
}

async function showDetail(id) {
  const res = await fetch(`/api/books/${id}`);
  const b = await res.json();

  alert(`📖 ${b.title}\n\n${b.content}`);
}

loadBooks();
