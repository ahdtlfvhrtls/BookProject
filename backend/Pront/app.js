const API = "http://localhost:3000/api";

// 책 생성
async function createBook() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  await fetch(`${API}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  alert("책 생성 완료!");
}

// 목록 이동
function goList() {
  location.href = "/list.html";
}

// 목록 불러오기
if (location.pathname.includes("list.html")) {
  fetch(`${API}/books`)
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("list");
      data.forEach((book) => {
        const div = document.createElement("div");
        div.innerHTML = `<a href="/detail.html?id=${book.id}">${book.title}</a>`;
        list.appendChild(div);
      });
    });
}

// 상세
if (location.pathname.includes("detail.html")) {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  fetch(`${API}/books/${id}`)
    .then((res) => res.json())
    .then((book) => {
      document.getElementById("title").innerText = book.title;
      document.getElementById("content").innerText = book.content;
    });
}
