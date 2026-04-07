import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBook } from "../api";

export default function BookDetail() {
  const { id } = useParams();
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

  return (
    <div className="book-container">
      <h2>{data.book.title}</h2>

      <div className="book">
        <div className="page">{data.pages[page].text}</div>
      </div>

      <div className="nav">
        <button onClick={prevPage}>◀ 이전</button>
        <span>
          {page + 1} / {data.pages.length}
        </span>
        <button onClick={nextPage}>다음 ▶</button>
      </div>
    </div>
  );
}
