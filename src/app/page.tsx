/**
 * page.tsx
 * 메인 홈 페이지 (Server Component)
 *
 * ※ Header 는 layout.tsx 에서 전역으로 렌더링되므로 이 파일에서는 제외합니다.
 * ─ 푸터 (copyright)
 */

/* ─────────────────────────────────────────────────────────────────────────
   푸터
───────────────────────────────────────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      id="footer"
      className="relative z-10 w-full py-5 text-center"
      style={{
        borderTop: "2px dashed rgba(0,0,0,0.1)",
        background: "rgba(255,255,255,0.9)",
      }}
    >
      <p style={{ fontFamily: "var(--font-body)", color: "var(--chalk-dim)", fontSize: "0.85rem" }}>
        © {year} ∞ 무한대수학반. All rights reserved.
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   메인 페이지 (default export)
───────────────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      {/* 메인 콘텐츠 영역 — 비워둠 */}
      <main className="flex-1" />
      <Footer />
    </>
  );
}
