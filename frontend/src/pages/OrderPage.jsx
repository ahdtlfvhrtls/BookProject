import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { estimateOrder, createOrder } from "../api";

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({
    recipientName: "",
    recipientPhone: "",
    postalCode: "",
    address1: "",
    address2: "",
    memo: "", // 배송 메모 필드
  });

  useEffect(() => {
    estimateOrder(id, 1).then((res) => {
      if (res.success) setEstimate(res.data);
      setLoading(false);
    });
  }, [id]);

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: (data) =>
        setShipping((prev) => ({
          ...prev,
          postalCode: data.zonecode,
          address1: data.address,
        })),
    }).open();
  };

  const handleOrder = async () => {
    // 필수 입력값 체크
    if (
      !shipping.recipientName ||
      !shipping.recipientPhone ||
      !shipping.address1
    ) {
      alert("배송 정보를 정확히 입력해주세요.");
      return;
    }

    try {
      const res = await createOrder({
        items: [{ bookUid: id, quantity: 1 }],
        shipping, // memo가 포함된 shipping 객체가 그대로 전송됩니다.
        externalRef: `order_${Date.now()}`,
      });
      if (res.success) {
        alert("🎉 주문 성공!");
        navigate("/orders");
      }
    } catch (err) {
      alert("오류 발생");
    }
  };

  if (loading) return <div className="order-container">⌛ 조회 중...</div>;

  return (
    <div className="order-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← 이전으로
      </button>
      <h1 style={{ marginBottom: "40px" }}>📦 주문서 작성</h1>

      <div style={{ display: "flex", gap: "60px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h3 className="order-section-title">수령인 정보</h3>
          <div className="order-form-group">
            <label className="order-label">이름</label>
            <input
              className="order-input"
              placeholder="수령인 성함"
              value={shipping.recipientName}
              onChange={(e) =>
                setShipping({ ...shipping, recipientName: e.target.value })
              }
            />
          </div>
          <div className="order-form-group">
            <label className="order-label">연락처</label>
            <input
              className="order-input"
              placeholder="010-0000-0000"
              value={shipping.recipientPhone}
              onChange={(e) =>
                setShipping({ ...shipping, recipientPhone: e.target.value })
              }
            />
          </div>

          <h3 className="order-section-title" style={{ marginTop: "40px" }}>
            배송지 정보
          </h3>
          <div className="order-form-group">
            <label className="order-label">주소</label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                className="order-input"
                style={{ width: "120px" }}
                value={shipping.postalCode}
                readOnly
                placeholder="우편번호"
              />
              <button
                className="address-search-btn"
                onClick={handleAddressSearch}
              >
                주소 찾기
              </button>
            </div>
            <input
              className="order-input"
              style={{ marginBottom: "10px" }}
              value={shipping.address1}
              readOnly
              placeholder="기본 주소"
            />
            <input
              className="order-input"
              style={{ marginBottom: "10px" }}
              placeholder="상세 주소"
              value={shipping.address2}
              onChange={(e) =>
                setShipping({ ...shipping, address2: e.target.value })
              }
            />

            {/* 배송 메모 입력란 추가 */}
            <label
              className="order-label"
              style={{ marginTop: "20px", display: "block" }}
            >
              배송 메모
            </label>
            <input
              className="order-input"
              placeholder="부재 시 문 앞에 놓아주세요 (선택사항)"
              value={shipping.memo}
              onChange={(e) =>
                setShipping({ ...shipping, memo: e.target.value })
              }
            />
          </div>
        </div>

        <div className="payment-summary-card">
          <h3 style={{ marginTop: 0, marginBottom: "25px" }}>결제 요약</h3>
          <div className="summary-item">
            <span>상품 금액</span>
            <span>{estimate.productAmount?.toLocaleString()}원</span>
          </div>
          <div className="summary-item">
            <span>배송비</span>
            <span>{estimate.shippingFee?.toLocaleString()}원</span>
          </div>
          <div className="total-amount-row">
            <span>총 결제 금액 (VAT포함)</span>
            <span>{estimate.paidCreditAmount?.toLocaleString()}원</span>
          </div>
          <button
            className="main-order-btn"
            style={{
              backgroundColor: estimate.creditSufficient
                ? "#4f46e5"
                : "#a5a5a5",
            }}
            onClick={handleOrder}
            disabled={!estimate.creditSufficient}
          >
            {estimate.creditSufficient ? "결제 및 주문하기" : "잔액 부족"}
          </button>
        </div>
      </div>
    </div>
  );
}
