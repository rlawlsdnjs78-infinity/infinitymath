<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design & Spacing Rules

- **좌우 여백 1.25rem 절대 통일 규칙**: 모든 박스(Card, Container, Item Box, Badge, Notice Box, Button, Input)의 내부 좌우 패딩은 정확히 `paddingLeft: "1.25rem"`, `paddingRight: "1.25rem"` (`px-5` / 20px)으로 100% 동일하게 통일하여 구현합니다.
- **신규 UI 요소 개발 시 필수 검수 프로세스**:
  - [ ] 모든 박스 UI 요소의 좌우 내부 패딩이 정확히 `1.25rem` (20px)으로 세팅되었는가?
  - [ ] 좌측 아이콘과 우측 텍스트가 박스 테두리와 마찰되지 않고 균형 잡힌 1.25rem 조화를 이루는가?
