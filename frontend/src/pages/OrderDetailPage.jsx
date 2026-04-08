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
        if (res.success && res.data) {
          setOrder(res.data); // 스펙에 따르면 res.data 바로 아래 필드들이 있음
        }
      })
      .catch((err) => console.error("API 상세조회 실패:", err))
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

  if (loading)
    return (
      <div className="order-container">⌛ 주문 상세 정보를 가져오는 중...</div>
    );
  if (!order)
    return <div className="order-container">데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="order-container" style={{ maxWidth: "700px" }}>
      <button className="back-btn" onClick={() => navigate("/orders")}>
        ← 이전으로
      </button>

      <div className="order-header">
        <h1>주문 상세 내역</h1>
        <span
          className={`status-badge status-${order.orderStatus >= 50 ? "complete" : "pending"}`}
        >
          {order.orderStatusDisplay}
        </span>
      </div>

      <div className="detail-section">
        <h3 className="order-section-title">📦 배송지 정보</h3>
        <table className="detail-table">
          <tbody>
            <tr>
              <th>수령인</th>
              <td>{order.recipientName}</td>
            </tr>
            <tr>
              <th>연락처</th>
              <td>{order.recipientPhone}</td>
            </tr>
            <tr>
              <th>주소</th>
              <td>
                ({order.postalCode}) {order.address1} {order.address2}
              </td>
            </tr>
            <tr>
              <th>배송 메모</th>
              {/* 스펙상 필드명은 shippingMemo입니다 */}
              <td>{order.shippingMemo || "없음"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section" style={{ marginTop: "40px" }}>
        <h3 className="order-section-title">💳 결제 정보</h3>
        <table className="detail-table">
          <tbody>
            <tr>
              <th>상품 합계</th>
              <td>{Number(order.totalProductAmount).toLocaleString()}원</td>
            </tr>
            <tr>
              <th>배송비</th>
              <td>{Number(order.totalShippingFee).toLocaleString()}원</td>
            </tr>
            <tr>
              <th>포장비</th>
              <td>{Number(order.totalPackagingFee || 0).toLocaleString()}원</td>
            </tr>
            <tr className="total-row">
              <th>결제 금액 (VAT 포함)</th>
              <td style={{ color: "#4f46e5", fontWeight: "bold" }}>
                {Number(order.paidCreditAmount).toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 상태 코드가 20(PAID) 또는 25(PDF_READY)일 때만 취소 가능 */}
      {(order.orderStatus === 20 || order.orderStatus === 25) && (
        <button className="full-cancel-btn" onClick={handleCancel}>
          주문 취소하기
        </button>
      )}
    </div>
  );
}
