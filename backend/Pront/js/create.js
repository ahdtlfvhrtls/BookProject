const pagesDiv = document.getElementById("pages");

function addPage() {
  const div = document.createElement("div");
  div.className = "page";

  div.innerHTML = `
    <h4>페이지</h4>
    <textarea placeholder="내용 입력"></textarea>
    <input type="file">
  `;

  pagesDiv.appendChild(div);
}

async function submitBook() {
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;

  const pageEls = document.querySelectorAll(".page");

  const pages = [];
  const formData = new FormData();

  pageEls.forEach((p, i) => {
    const text = p.querySelector("textarea").value;
    const file = p.querySelector("input").files[0];

    pages.push({ text });

    if (file) formData.append("images", file);
  });

  formData.append("title", title);
  formData.append("author", author);
  formData.append("pages", JSON.stringify(pages));

  await fetch("/api/books", {
    method: "POST",
    body: formData,
  });

  alert("완료!");
  location.href = "/";
}

// 기본 페이지 하나
addPage();
