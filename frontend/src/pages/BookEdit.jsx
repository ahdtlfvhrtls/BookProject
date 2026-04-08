import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBook, updateBook } from "../api";

export default function BookEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState([
    { text: "", file: null, previewUrl: null },
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getBook(id)
      .then((data) => {
        if (data && data.book) {
          setTitle(data.book.title || "");
          setAuthor(data.book.author || "");
          setCoverPreview(
            `http://localhost:3000/uploads/${data.book.cover_image}`,
          );

          if (data.pages && data.pages.length > 0) {
            const formattedPages = data.pages.map((p) => ({
              text: p.text || "",
              image_url: p.image_url,
              previewUrl: p.image_url
                ? `http://localhost:3000/uploads/${p.image_url}`
                : null,
              file: null,
            }));
            setPages(formattedPages);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handlePageChange = (value) => {
    const newPages = [...pages];
    newPages[currentPage].text = value;
    setPages(newPages);
  };

  const handlePageImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const newPages = [...pages];
    newPages[currentPage] = {
      ...newPages[currentPage],
      file,
      previewUrl: URL.createObjectURL(file),
    };
    setPages(newPages);
  };

  const handleSubmit = async () => {
    try {
      const res = await updateBook(id, { title, author, cover, pages });
      if (res.success) {
        alert("수정 완료!");
        navigate(`/books/${id}`);
      }
    } catch (err) {
      alert("수정 실패");
    }
  };

  if (loading) return <div className="container">데이터 로딩 중...</div>;

  return (
    <div className="container" style={{ position: "relative" }}>
      <div className="home-btn-wrapper">
        <button className="home-btn" onClick={() => navigate("/")}>
          🏠 목록으로
        </button>
      </div>

      <div className="editor">
        <h1>✏️ 책 수정하기</h1>

        <div className="form">
          <div className="form-group">
            <label>제목</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>저자</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>

          <div className="form-group">
            <label>표지 교체</label>
            <input type="file" onChange={handleCoverChange} />
            {coverPreview && (
              <div className="preview-container">
                <img src={coverPreview} className="img-preview" alt="cover" />
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
        </div>

        <textarea
          value={pages[currentPage]?.text || ""}
          onChange={(e) => handlePageChange(e.target.value)}
        />

        <div className="form-group" style={{ marginTop: "20px" }}>
          <label>내지 이미지 교체</label>
          <input
            type="file"
            key={currentPage}
            onChange={handlePageImageChange}
          />
          {pages[currentPage]?.previewUrl && (
            <div className="preview-container">
              <img
                src={pages[currentPage].previewUrl}
                className="img-preview"
                alt="preview"
              />
            </div>
          )}
        </div>

        <div className="editor-actions">
          <button className="submit" onClick={handleSubmit}>
            수정 완료
          </button>
        </div>
      </div>
    </div>
  );
}
