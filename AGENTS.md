<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design & Spacing Rules

- **여백 및 패딩 최우선 원칙**: 모든 박스(Card, Container, Pill, Badge, Notice Box)와 구분선(Divider, Dashed line)을 작성할 때는 글자, 이모지, SVG 아이콘 등 어떠한 콘텐츠도 박스 테두리에 결코 닿지 않도록 상하좌우 내부 패딩(`padding: 1.25rem ~ 2.5rem`)과 외부 마진(`margin: 1.25rem ~ 2.5rem`)을 넉넉하고 시원하게 부여합니다.
- **테두리 절연(Border Insulation) 인라인 스타일 프로세스**:
  1. 안내 상자(Notice Box) 및 뱃지 작성 시 아이콘이 좌측 테두리에 닿지 않도록 `paddingLeft: "3.25rem"` (52px 이상) 인라인 스타일을 필수로 적용합니다.
  2. 텍스트가 우측 테두리에 닿지 않도록 `paddingRight: "2.5rem"` (40px 이상) 및 `wordBreak: "break-all"`을 적용합니다.
- **신규 UI 요소 개발 시 필수 검수 프로세스**:
  - [ ] 아이콘 좌측과 테두리 사이 50px 이상의 충분한 절연 여백이 확보되었는가?
  - [ ] 우측 글자 끝이 우측 테두리선과 접촉하지 않는가?
  - [ ] 시각적 답답함 없이 공간감이 느껴지는 넉넉한 여백 미를 준수하였는가?
