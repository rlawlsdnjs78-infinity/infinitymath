<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design & Spacing Rules

- **여백 및 패딩 최우선 원칙**: 모든 박스(Card, Container, Pill, Badge)와 구분선(Divider, Dashed line)을 작성할 때는 글자나 콘텐츠가 테두리에 결코 닿지 않도록 상하좌우 내부 패딩(`padding: 1.25rem ~ 1.75rem`)과 외부 마진(`margin: 1.25rem ~ 2.5rem`)을 넉넉하고 시원하게 부여합니다.
- 시각적 답답함 없이 공간감이 느껴지는 여백 미를 최우선으로 준수합니다.
