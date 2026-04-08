import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks } from "../api";

export default function BookList() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  return (
    <div className="container">
      <div className="list-header">
        <h2>📚 내 책장</h2>
        <div className="main-nav-bar">
          <button
            className="nav-btn btn-primary"
            onClick={() => navigate("/create")}
          >
            ➕ 새 책 만들기
          </button>
          <button
            className="nav-btn btn-outline"
            onClick={() => navigate("/orders")}
          >
            📑 주문 내역 보기
          </button>
        </div>
      </div>

      <div className="grid">
        {books.map((b) => (
          <div
            key={b.book_uid}
            className="card"
            onClick={() => navigate(`/books/${b.book_uid}`)}
          >
            <div className="thumb">
              {b.cover_image ? (
                <img
                  src={`http://localhost:3000/uploads/${b.cover_image}`}
                  alt="cover"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "이미지 없음"
              )}
            </div>

            <div className="card-content">
              <h3>{b.title}</h3>
              <p>{b.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
