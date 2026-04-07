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
      <div className="header">
        <h2>📚 책 목록</h2>
        <button onClick={() => navigate("/books/new")}>+ 책 만들기</button>
      </div>

      <div className="grid">
        {books.map((b) => (
          <div
            key={b.book_uid}
            className="card"
            onClick={() => navigate(`/books/${b.book_uid}`)}
          >
            <div className="thumb"></div>
            <h3>{b.title}</h3>
            <p>{b.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
