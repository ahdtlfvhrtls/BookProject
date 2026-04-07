import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookList from "./pages/BookList";
import BookEditor from "./pages/BookEditor";
import BookDetail from "./pages/BookDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BookList />} />
        <Route path="/books/new" element={<BookEditor />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/books/:id/edit" element={<BookEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
