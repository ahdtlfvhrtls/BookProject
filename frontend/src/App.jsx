import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./pages/BookList";
import BookEditor from "./pages/BookEditor";
import BookDetail from "./pages/BookDetail";
import BookEdit from "./pages/BookEdit";
import OrderPage from "./pages/OrderPage";
import OrderListPage from "./pages/OrderListPage";
import OrderDetailPage from "./pages/OrderDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookList />} />
        {/* 새 책 작성 페이지 */}
        <Route path="/books/new" element={<BookEditor />} />

        {/* [중요] 수정 페이지가 상세 페이지보다 위에 있는게 안전합니다 */}
        <Route path="/books/:id/edit" element={<BookEdit />} />

        {/* 상세 페이지 */}
        <Route path="/books/:id" element={<BookDetail />} />
        {/* 결제 페이지 */}
        <Route path="/order/:id" element={<OrderPage />} />
        {/* 주문 내역 페이지 */}
        <Route path="/orders" element={<OrderListPage />} />
        {/* 주문 상세 페이지 */}
        <Route path="/orders/:orderUid" element={<OrderDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
