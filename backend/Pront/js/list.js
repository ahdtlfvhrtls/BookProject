async function load() {
  const res = await fetch("/api/books");
  const data = await res.json();

  const list = document.getElementById("list");

  list.innerHTML = data
    .map(
      (b) => `
    <div class="card" onclick="go(${b.id})">
      <h3>${b.title}</h3>
      <p>${b.author}</p>
    </div>
  `,
    )
    .join("");
}

function go(id) {
  location.href = "detail.html?id=" + id;
}

load();
