import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBook, deleteBook, orderBook } from "../api";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await getBook(id);
        if (res.success) setBook(res.data);
        else {
          alert("책 정보를 가져오지 못했습니다.");
          navigate("/");
        }
      } catch (err) {
        console.error(err);
        alert("에러 발생");
      }
    };
    fetchBook();
  }, [id, navigate]);

  if (!book) return <div>로딩중...</div>;

  const nextPage = () => {
    if (page < book.pages.length - 1) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await deleteBook(id);
      if (res.success) {
        alert("삭제 완료");
        navigate("/");
      } else {
        alert("삭제 실패");
      }
    } catch (err) {
      console.error(err);
      alert("에러 발생");
    }
  };

  const handleOrder = async () => {
    try {
      const res = await orderBook(id);
      if (res.success) alert("주문 완료");
      else alert("주문 실패");
    } catch (err) {
      console.error(err);
      alert("에러 발생");
    }
  };

  return (
    <div className="book-container">
      <h2>{book.title}</h2>
      <p>작성자: {book.author}</p>

      <div className="book">
        <div className="page">
          {book.pages[page].image && (
            <img
              src={book.pages[page].image}
              alt={`페이지 ${page + 1}`}
              style={{
                maxWidth: "100%",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            />
          )}
          <p>{book.pages[page].text}</p>
        </div>

        <div className="nav">
          <button onClick={prevPage}>◀ 이전</button>
          <span>
            {page + 1} / {book.pages.length}
          </span>
          <button onClick={nextPage}>다음 ▶</button>
        </div>
      </div>

      <div
        className="editor-actions"
        style={{ justifyContent: "center", gap: "12px", marginTop: "30px" }}
      >
        <button className="submit" onClick={() => navigate(`/edit/${id}`)}>
          수정
        </button>
        <button className="delete-page" onClick={handleDelete}>
          삭제
        </button>
        <button className="submit" onClick={handleOrder}>
          주문
        </button>
      </div>
    </div>
  );
}
