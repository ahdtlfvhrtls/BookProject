import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../api";

export default function BookEditor() {
  const [book, setBook] = useState({
    title: "",
    author: "",
    pages: [{ text: "" }],
  });

  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!book.title || !book.author) {
      alert("제목과 작성자를 입력해주세요");
      return;
    }

    await createBook({
      title: book.title,
      author: book.author,
      pages: book.pages,
    });

    navigate("/");
  };

  const addPage = () => {
    setBook({
      ...book,
      pages: [...book.pages, { text: "" }],
    });
  };

  const deletePage = () => {
    if (book.pages.length === 1) {
      alert("최소 1페이지는 필요합니다");
      return;
    }

    const newPages = book.pages.filter((_, i) => i !== currentPage);

    setBook({ ...book, pages: newPages });
    setCurrentPage(0);
  };

  return (
    <div className="editor">
      <h2>📖 책 만들기</h2>

      {/* 🔥 안내문 */}
      <div className="notice">
        <p>📌 안내</p>
        <p>• 표지, 간지, 발행 페이지는 자동으로 생성됩니다.</p>
        <p>• 현재는 본문(내지) 내용만 작성하면 됩니다.</p>
        <p>• 페이지 수가 부족하면 자동으로 채워져 책이 완성됩니다.</p>
      </div>

      {/* 🔥 입력 폼 */}
      <div className="form">
        <div className="form-group">
          <label>제목</label>
          <input
            placeholder="책 제목을 입력하세요"
            value={book.title}
            onChange={(e) => setBook({ ...book, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>작성자</label>
          <input
            placeholder="작성자 이름"
            value={book.author}
            onChange={(e) => setBook({ ...book, author: e.target.value })}
          />
        </div>
      </div>

      {/* 🔥 페이지 버튼 */}
      <div className="page-buttons">
        {book.pages.map((_, i) => (
          <button
            key={i}
            className={i === currentPage ? "active" : ""}
            onClick={() => setCurrentPage(i)}
          >
            {i + 1}
          </button>
        ))}

        <button className="add" onClick={addPage}>
          +
        </button>
      </div>

      {/* 🔥 본문 작성 */}
      <textarea
        placeholder="페이지 내용을 입력하세요..."
        value={book.pages[currentPage].text}
        onChange={(e) => {
          const copy = [...book.pages];
          copy[currentPage].text = e.target.value;
          setBook({ ...book, pages: copy });
        }}
      />

      {/* 🔥 버튼 영역 */}
      <div className="editor-actions">
        <button className="delete-page" onClick={deletePage}>
          페이지 삭제
        </button>

        <button className="submit" onClick={handleSubmit}>
          책 생성 완료
        </button>
      </div>
    </div>
  );
}
