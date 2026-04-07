import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook, deleteBook, orderBook } from "../api";

export default function BookDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getBook(id).then(setData);
  }, [id]);

  if (!data) return <div>로딩중...</div>;

  return (
    <div className="viewer">
      <h2>{data.book.title}</h2>

      <div className="page-buttons">
        {data.pages.map((_, i) => (
          <button onClick={() => setPage(i)}>{i + 1}</button>
        ))}
      </div>

      <div className="page-content">{data.pages[page].text}</div>

      <div className="actions">
        <button onClick={() => navigate(`/books/${id}/edit`)}>수정</button>

        <button
          onClick={async () => {
            await deleteBook(id);
            navigate("/");
          }}
        >
          삭제
        </button>

        <button
          onClick={async () => {
            await orderBook(id);
            alert("주문 완료");
          }}
        >
          주문
        </button>
      </div>
    </div>
  );
}
