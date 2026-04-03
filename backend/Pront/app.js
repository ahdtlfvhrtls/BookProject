async function createOrder() {
  const title = document.getElementById("title").value;
  const name = document.getElementById("name").value;

  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, name }),
  });

  const data = await res.json();

  alert("주문 완료!\nBook UID: " + data.bookUid);
}

async function loadOrders() {
  const res = await fetch("/api/orders");
  const orders = await res.json();

  const list = document.getElementById("orderList");
  list.innerHTML = "";

  orders.forEach((o) => {
    const li = document.createElement("li");
    li.textContent = `UID: ${o.book_uid} / 상태: ${o.status}`;
    list.appendChild(li);
  });
}
