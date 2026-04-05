const id = new URLSearchParams(location.search).get("id");

async function load() {
  const res = await fetch("/api/books/" + id);
  const data = await res.json();

  document.getElementById("title").innerText = data.title;
  document.getElementById("author").innerText = data.author;

  const pages = JSON.parse(data.content);

  document.getElementById("content").innerHTML = pages
    .map((p) => `<p>${p.text}</p>`)
    .join("");
}

load();
