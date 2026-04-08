import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetail, cancelOrder } from "../api";

export default function OrderDetailPage() {
  const { orderUid } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderDetail(orderUid)
      .then((res) => {
        // 브라우저 개발자 도구(F12) 콘솔에서 이 로그를 꼭 확인하세요!
        console.log("실제 넘어온 데이터 전체:", res);

        if (res.success && res.data) {
          setOrder(res.data);
        }
      })
      .catch((err) => console.error("상세조회 에러:", err))
      .finally(() => setLoading(false));
  }, [orderUid]);

  const handleCancel = async () => {
    if (!window.confirm("정말로 이 주문을 취소하시겠습니까?")) return;
    const res = await cancelOrder(orderUid);
    if (res.success) {
      alert("주문이 취소되었습니다.");
      navigate("/orders");
    } else {
      alert("취소 실패: " + res.message);
    }
  };

  if (loading) return <div className="order-container">⌛ 불러오는 중...</div>;
  if (!order)
    return <div className="order-container">주문 내역이 없습니다.</div>;

  return (
    <div className="order-container" style={{ maxWidth: "700px" }}>
      <button className="back-btn" onClick={() => navigate("/orders")}>
        ← 이전으로
      </button>

      <div className="order-header" style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: 0 }}>주문 상세 내역</h1>
        <span
          className={`status-badge status-${order.orderStatus >= 50 ? "complete" : "pending"}`}
        >
          {order.orderStatusDisplay}
        </span>
      </div>

      <div className="detail-section">
        <h3 className="order-section-title">📦 배송 정보</h3>
        <table className="detail-table">
          <tbody>
            <tr>
              <th>수령인</th>
              {/* 혹시 몰라서 다양한 필드명을 체크하도록 방어 코드를 짰습니다 */}
              <td>
                {order.shipping?.recipientName ||
                  order.recipientName ||
                  "데이터 없음"}
              </td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>
                {order.shipping?.recipientPhone ||
                  order.recipientPhone ||
                  "데이터 없음"}
              </td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                {order.shipping?.postalCode || order.postalCode
                  ? `(${order.shipping?.postalCode || order.postalCode}) `
                  : ""}
                {order.shipping?.address1 || order.address1}{" "}
                {order.shipping?.address2 || order.address2}
                {!(order.shipping?.address1 || order.address1) &&
                  "주소 정보 없음"}
              </td>
            </tr>
            <tr>
              <th>배송메모</th>
              <td>{order.shipping?.memo || order.memo || "없음"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section" style={{ marginTop: "40px" }}>
        <h3 className="order-section-title">💳 결제 정보</h3>
        <table className="detail-table">
          <tbody>
            <tr>
              <th>상품 금액</th>
              <td>{order.productAmount?.toLocaleString()}원</td>
            </tr>
            <tr>
              <th>배송비</th>
              <td>{order.shippingFee?.toLocaleString()}원</td>
            </tr>
            <tr className="total-row">
              <th>총 결제 금액</th>
              <td>{order.totalAmount?.toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
      </div>

      {order.orderStatus < 50 && (
        <button className="full-cancel-btn" onClick={handleCancel}>
          주문 취소하기
        </button>
      )}
    </div>
  );
}
