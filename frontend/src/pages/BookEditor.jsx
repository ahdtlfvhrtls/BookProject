import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBook } from "../api";

export default function BookEditor() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  // 각 페이지 객체에 file과 previewUrl을 직접 관리
  const [pages, setPages] = useState([
    { text: "", file: null, previewUrl: null },
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // 텍스트 변경
  const handlePageChange = (value) => {
    const newPages = [...pages];
    newPages[currentPage].text = value;
    setPages(newPages);
  };

  // 현재 페이지의 이미지 변경
  const handlePageImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newPages = [...pages];
    // 기존 URL 메모리 해제 (성능 최적화)
    if (newPages[currentPage].previewUrl) {
      URL.revokeObjectURL(newPages[currentPage].previewUrl);
    }

    newPages[currentPage] = {
      ...newPages[currentPage],
      file: file,
      previewUrl: URL.createObjectURL(file),
    };
    setPages(newPages);
  };

  // 표지 변경
  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const addPage = () => {
    setPages([...pages, { text: "", file: null, previewUrl: null }]);
    setCurrentPage(pages.length);
  };

  const removePage = (index) => {
    if (pages.length === 1) return;
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages);
    if (currentPage >= newPages.length) setCurrentPage(newPages.length - 1);
  };

  const handleSubmit = async () => {
    if (!title || !author) {
      alert("제목과 작성자를 입력해주세요");
      return;
    }

    try {
      const res = await createBook({
        title,
        author,
        cover,
        pages, // 이제 pages 안에 각 파일 정보가 들어있음
      });

      if (res.success) {
        alert("책 생성 완료!");
        navigate(`/books/${res.bookUid}`);
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
      <div className="notice">
        본문 내용만 입력하면 나머지 표지/간지/발행면은 자동으로 생성됩니다.
      </div>

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
          <label>표지 이미지</label>
          <input type="file" onChange={handleCoverChange} />
          {coverPreview && (
            <div className="preview-container">
              <img src={coverPreview} alt="cover" className="img-preview" />
            </div>
          )}
        </div>
      </div>

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

      <textarea
        value={pages[currentPage].text}
        onChange={(e) => handlePageChange(e.target.value)}
        placeholder="내용을 입력하세요..."
      />

      <div className="form-group" style={{ marginTop: "20px" }}>
        <label>해당 페이지 이미지 (선택)</label>
        {/* key를 currentPage로 주면 페이지 바뀔 때마다 input UI가 초기화되어 꼬이지 않음 */}
        <input type="file" key={currentPage} onChange={handlePageImageChange} />
        {pages[currentPage].previewUrl && (
          <div className="preview-container">
            <img
              src={pages[currentPage].previewUrl}
              alt="page preview"
              className="img-preview"
            />
          </div>
        )}
      </div>

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
