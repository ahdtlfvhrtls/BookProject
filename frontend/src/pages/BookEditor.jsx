import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../api";

export default function BookEditor() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState([{ text: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState([]);

  const handlePageChange = (value) => {
    const newPages = [...pages];
    newPages[currentPage].text = value;
    setPages(newPages);
  };

  const addPage = () => {
    setPages([...pages, { text: "" }]);
    setCurrentPage(pages.length);
  };

  const removePage = (index) => {
    if (pages.length === 1) return;

    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);

    if (currentPage >= newPages.length) {
      setCurrentPage(newPages.length - 1);
    }
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleSubmit = async () => {
    if (!title || !author) {
      alert("제목과 작성자를 입력해주세요");
      return;
    }

    if (images.length === 0) {
      alert("이미지 최소 1개 필요");
      return;
    }

    try {
      const res = await createBook({
        title,
        author,
        pages,
        images,
      });

      if (res.success) {
        alert("책 생성 완료!");
        navigate("/");
      } else {
        alert("생성 실패");
      }
    } catch (err) {
      console.error(err);
      alert("에러 발생");
    }
  };

  return (
    <div className="editor">
      <h1>📚 책 만들기</h1>

      {/* 안내문 */}
      <div className="notice">
        본문 내용만 입력하면 나머지 표지/간지/발행면은 자동으로 생성됩니다.
      </div>

      {/* 입력 영역 */}
      <div className="form">
        <div className="form-group">
          <label>제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 입력"
          />
        </div>

        <div className="form-group">
          <label>작성자</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="작성자 입력"
          />
        </div>

        <div className="form-group">
          <label>표지 이미지 업로드 (최소 1개)</label>
          <input type="file" multiple onChange={handleImageChange} />
        </div>
      </div>

      {/* 페이지 버튼 */}
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
        <button className="add" onClick={addPage}>
          +
        </button>
      </div>

      {/* 본문 */}
      <textarea
        value={pages[currentPage].text}
        onChange={(e) => handlePageChange(e.target.value)}
        placeholder="내용을 입력하세요..."
      />

      {/* 하단 버튼 */}
      <div className="editor-actions">
        <button className="delete-page" onClick={() => removePage(currentPage)}>
          페이지 삭제
        </button>

        <button className="submit" onClick={handleSubmit}>
          작성 완료
        </button>
      </div>
    </div>
  );
}
