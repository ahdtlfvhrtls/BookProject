import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook, deleteBook } from "../api";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    getBook(id).then(setData);
  }, [id]);

  if (!data) return <div>로딩중...</div>;

  const nextPage = () => {
    if (page < data.pages.length - 1) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const current = data.pages[page];

  const handleDelete = async () => {
    if (!window.confirm("정말로 삭제하시겠습니까?")) return;

    try {
      const res = await deleteBook(id); // id는 useParams로 가져온 book_uid
      if (res.success) {
        alert("삭제되었습니다.");
        navigate("/"); // 목록으로 이동
      } else {
        alert("삭제 실패: " + (res.message || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error(err);
      alert("서버 통신 오류로 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="book-container">
      <div className="home-btn-wrapper">
        <button className="home-btn" onClick={() => navigate("/")}>
          🏠 목록으로
        </button>
      </div>
      <h2>{data.book.title}</h2>
      <h4 className="book-author">{data.book.author}</h4>

      <div className="book">
        <div className="page">
          {current.image_url && (
            <div className="page-image">
              <img
                src={`http://localhost:3000/uploads/${current.image_url}`}
                alt={`page ${page + 1}`}
              />
            </div>
          )}
          <div className="page-text">{current.text}</div>
        </div>
      </div>

      <div className="nav">
        <button onClick={prevPage}>◀ 이전</button>
        <span>
          {page + 1} / {data.pages.length}
        </span>
        <button onClick={nextPage}>다음 ▶</button>
      </div>

      <div className="detail-actions">
        <div className="left-buttons">
          <button
            className="edit-btn"
            onClick={() => navigate(`/books/${id}/edit`)}
          >
            수정
          </button>
          <button className="delete-btn" onClick={handleDelete}>
            삭제
          </button>
        </div>
        <div className="right-buttons">
          <button
            className="order-btn"
            onClick={() => navigate(`/order/${id}`)}
          >
            주문
          </button>
        </div>
      </div>
    </div>
  );
}
