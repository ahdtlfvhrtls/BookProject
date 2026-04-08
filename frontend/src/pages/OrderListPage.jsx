import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOrders, cancelOrder } from "../api";

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = () => {
    setLoading(true);
    getOrders()
      .then((res) => {
        if (res.success) setOrders(res.data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (e, orderUid, status) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (status >= 50) {
      return alert("이미 제작/배송 중인 상품은 취소할 수 없습니다.");
    }

    if (!window.confirm("정말로 이 주문을 취소하시겠습니까?")) return;

    const res = await cancelOrder(orderUid);
    if (res.success) {
      alert("주문이 취소되었습니다.");
      fetchOrders(); // 목록 새로고침
    } else {
      alert("취소 실패: " + res.message);
    }
  };

  if (loading) return <div className="order-container">⌛ 내역 확인 중...</div>;

  return (
    <div className="order-container" style={{ maxWidth: "800px" }}>
      <div className="order-header">
        <h1>📑 나의 주문 내역</h1>
        <button className="search-btn" onClick={() => navigate("/")}>
          메인으로
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-msg">주문 내역이 없습니다.</div>
      ) : (
        orders.map((order) => (
          <div
            key={order.orderUid}
            className="order-list-card selectable"
            onClick={() => navigate(`/orders/${order.orderUid}`)} // 상세 페이지로 이동
          >
            <div className="order-info">
              <span
                className={`status-badge status-${order.orderStatus >= 50 ? "complete" : "pending"}`}
              >
                {order.orderStatusDisplay}
              </span>
              <h3 className="order-item-name">
                {order.items?.[0]?.bookSpecUid || "포토북"}
                {order.items?.length > 1
                  ? ` 외 ${order.items.length - 1}건`
                  : ""}
              </h3>
              <p className="order-uid">{order.orderUid}</p>
            </div>

            <div className="order-price-info">
              <div className="order-price">
                {order.totalAmount?.toLocaleString()}원
              </div>
              <div className="order-date">
                {new Date(order.orderedAt).toLocaleDateString()}
              </div>

              {/* 결제완료(10) ~ 상품준비중(40) 단계까지만 취소 버튼 노출 */}
              {order.orderStatus < 50 && (
                <button
                  className="cancel-btn"
                  onClick={(e) =>
                    handleCancel(e, order.orderUid, order.orderStatus)
                  }
                >
                  주문 취소
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
