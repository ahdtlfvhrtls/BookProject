import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createBook, getBook } from "../api";

export default function BookEditor() {
  const [pages, setPages] = useState([{ text: "" }]);
  const [currentPage, setCurrentPage] = useState(0);

  const { id } = useParams();
  const navigate = useNavigate();

  // 수정 모드
  useEffect(() => {
    if (!id) return;

    getBook(id).then((data) => {
      setPages(data.pages);
    });
  }, [id]);

  const handleSubmit = async () => {
    await createBook({
      title: "제목",
      author: "작성자",
      pages: JSON.stringify(pages),
    });

    navigate("/");
  };

  return (
    <div className="editor">
      <div className="page-buttons">
        {pages.map((_, i) => (
          <button
            key={i}
            className={i === currentPage ? "active" : ""}
            onClick={() => setCurrentPage(i)}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={() => setPages([...pages, { text: "" }])}>+</button>
      </div>

      <textarea
        value={pages[currentPage].text}
        onChange={(e) => {
          const copy = [...pages];
          copy[currentPage].text = e.target.value;
          setPages(copy);
        }}
      />

      <button onClick={handleSubmit}>작성 완료</button>
    </div>
  );
}
