# Phase 2 — AgentKid content swap

**Status: DONE (copy swapped, EN + VI). Launch-blocking follow-ups listed at the bottom.**

Website gốc Khanmigo đã được mirror 1:1 ở Phase 1, sau đó toàn bộ **text** được đổi sang nội
dung sản phẩm **AgentKid**, giữ nguyên DOM / CSS / layout / JS.

```
site/index.html      -> English (default locale)
site/vi/index.html   -> Tiếng Việt
```

## Nguồn nội dung (authoritative)

Mọi câu chữ lấy từ repo AgentKid, **không tự bịa**:

| Nguồn | Dùng cho |
|---|---|
| `D:\work\agentkid\AgentKid Website\PRODUCT_WEBSITE_BRIEF.md` | định vị, hero copy (brief có sẵn cả EN + VI), nav, nguyên tắc truyền thông |
| `D:\work\agentkid\README.md` | tính năng **đã thật sự có** trong MVP |
| `D:\work\agentkid\messages\{en,vi}\*.json` | từ vựng sản phẩm (Kid Mode, Routine, Emotion, Safety Alerts, Memories…) |
| `D:\work\agentkid\docs\i18n-contract.md` | quy ước 2 locale `en` / `vi` |

## Guardrails đã tuân thủ

Brief liệt kê rõ những gì **không được nói**. Toàn bộ copy đã tránh:

- Không nói AI hiểu chính xác cảm xúc của trẻ.
- Không nói AgentKid điều trị / cải thiện tự kỷ.
- Không hứa "an toàn tuyệt đối" — FAQ nói thẳng *"No system can promise absolute safety."*
- Không claim cá nhân hoá hoàn toàn, không claim clinically proven.
- Không dùng revolutionary / next-generation / unlock the power of AI.
- **Không bịa testimonial, không bịa KPI.** 3 slide testimonial được chuyển thành 3
  "design principle" nói đúng những gì code đã làm (xin xem mục *Cần làm trước khi launch*).
- Giữ phân biệt rõ giữa **đã có trong MVP** và **đang nghiên cứu** (FAQ cuối nói rõ voice /
  multimodal emotion / adaptive lesson chỉ là hướng nghiên cứu).

## Nội dung đã đổi — hero

Lấy nguyên văn từ brief:

| | EN | VI |
|---|---|---|
| Headline | Small steps for children. | Từng bước nhỏ cho trẻ. |
| Typer | Clear visibility for parents. / Calm and structured. / Built for ages 6 to 10. / Safety checked every message. / Parent-controlled data. | Mọi tiến trình rõ ràng với phụ huynh. / Bình tĩnh và có cấu trúc. / Dành cho trẻ 6 đến 10 tuổi. / Kiểm tra an toàn mọi tin nhắn. / Dữ liệu do phụ huynh kiểm soát. |
| Trust line | AgentKid is a support tool. It does not diagnose, does not treat… | AgentKid là công cụ hỗ trợ. Hệ thống không chẩn đoán… |

## Bản đồ slot → nội dung mới

| Khu vực | Khanmigo | AgentKid |
|---|---|---|
| Nav | Learners / Parents / Writing Coach / Districts | For children / For parents / Safety / Research |
| Nav dropdown "Offerings" | Math, Science, Khan Kids, SAT, Khanmigo | Product: Chat, Mini lessons, Routines, Emotion check-in, Progress |
| Nav dropdown "About" | Mastery learning, Why KAD? | Our approach, Why AgentKid? |
| Hero 3 card | For teachers / For districts / For writing | For children / For parents / For admins |
| Endorsers | WSJ quote, 4-star rating, teacher quote | 3 câu về scope / safety checks / quyền dữ liệu |
| Value prop H2 | On-demand AI-powered support for education. | A calm, structured learning companion for ages 6 to 10. |
| Value prop block 1 | For teachers — Experience the best AI for teachers. | For children — Four small activities, one calm space. |
| Value prop block 2 | For learners — Build your brain power. | For parents — Progress you can see. Data you control. |
| Value prop block 3 | For parents — Turn homework into high fives. | For safety — Every message is checked, in and out. |
| Social proof H2 | Praise for Khanmigo | The principles behind AgentKid |
| Testimonials ×3 | Ms. Bartsch / Dani Guardiola / Katie | 3 × "Design principle" (scope / safety / privacy) |
| FAQ ×6 | What is Khanmigo / ChatGPT… | What is AgentKid / doctor, therapist? / how safe / what can my child do / who sees data / ages & languages |
| Video section | Get a glimpse of the future of learning (Sal Khan TED) | See the product surface. |
| Final CTA | Experience the best AI-powered tool in education | A safe learning companion, with parent oversight |
| Footer buttons | Get Khanmigo / Khanmigo for Districts | Explore AgentKid / Request a demo |
| Footer links | Visit Khan Academy, Terms, Privacy, Cookie, Accessibility | Product overview, Terms, Privacy, Cookie, Accessibility |
| `<title>` + 5 meta | Meet Khanmigo… | AgentKid — A safe learning companion… |

Tổng: **185 thao tác thay thế**, áp cho 2 locale.

## Chi tiết kỹ thuật

- **Cơ chế**: `scripts/swap-content.mjs` đọc bản pristine
  (`RECON/localized-pristine.html`) rồi thay **literal string** theo
  `content/agentkid-content.mjs`. Mỗi op khai báo `expect` (số lần khớp bắt buộc) —
  build **fail cứng** nếu một thay thế không khớp, nên không thể âm thầm no-op.
- **Audit tự động**: sau khi thay, script chặn mọi reference Khanmigo/Khan Academy còn sót ở
  3 chỗ — text hiển thị, link remote, và meta. Ngoại lệ hợp lệ: đường dẫn asset nội bộ
  `mirror/khanmigo/...` và `data-wf-domain` (Webflow runtime đọc).
- **FAQ render 2 lần**: site gốc có 2 nhánh FAQ (`.accordion-item` trong `<ul>`, và
  `.accordiontrigger`/`.accordionitem`). Cả hai đều được thay; nhánh 2 có **thứ tự câu khác**
  nên dùng `ACCORDION_ITEM_ORDER = [2,0,3,4,1,5]`.
- **Song ngữ**: `/` là EN, `/vi/` là VI. Đã thêm `lang` đúng, `hreflang` (`x-default`,
  `en`, `vi`), canonical, và một link chuyển ngữ trong nav (`a.lang-switch`). Link này là
  thay đổi DOM **duy nhất** ngoài text — cần thiết để song ngữ dùng được.
- **Đường dẫn asset**: trang VI nằm trong thư mục con nên mọi reference asset được thêm
  tiền tố `../` (CSS không cần vì `url()` trong CSS resolve theo vị trí file CSS).
- **Không sửa**: class Webflow, `data-w-*`, `data-wf-*`, cấu trúc DOM, CSS, JS.

## Kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Console error (EN `/`, VI `/vi/`, EN 390px) | **0 / 0 / 0** |
| HTTP 4xx+ | **0 / 0 / 0** |
| Webflow IX2 runtime | chạy ở cả 2 locale |
| FAQ accordion (6 mục × 2 nhánh) | mở/đóng được ở cả 2 locale |
| Testimonial slider | chuyển slide được ở cả 2 locale |
| Chuyển ngữ EN → VI → EN | ok, `lang` đúng ở cả hai chiều |
| Text "Khanmigo"/"Khan Academy" còn hiển thị | **không còn** |
| Tiếng Việt có dấu | render đúng (đã self-host đủ subset `vietnamese` của font) |
| Tràn ngang ở 375/390px | **giống hệt bản gốc** (scrollW 397/405) → hành vi của slider gốc, không phải lỗi do đổi text |
| Text bị cắt / overflow | không có |

Layout lệch nhẹ so với bản gốc (hero cao thêm ~19px…) là **đương nhiên**: chữ khác thì số dòng
khác. Cấu trúc section, thứ tự và vị trí footer giữ nguyên.

## ⚠️ Cần làm trước khi launch (ảnh vẫn là của Khanmigo)

Anh chọn **"chỉ đổi text"** nên toàn bộ ảnh gốc được giữ nguyên. Hệ quả — phải xử lý trước khi
công khai:

| # | Vấn đề | Vị trí | Mức độ |
|---|---|---|---|
| 1 | **Logo vẫn là "Khanmigo by Khan Academy"** | `assets/brand/…Khanmigo Logo.svg` | **Chặn launch** |
| 2 | **Logo báo chí WSJ / Washington Post / Common Sense** đứng cạnh text của AgentKid → thành **chứng thực sai** (báo chí chưa hề nói về AgentKid) | `assets/press/*` | **Chặn launch về pháp lý** |
| 3 | Ảnh minh hoạ hero / 3 khối / footer là UI + người của Khanmigo | `assets/{hero,teacher,learners,parents,final-cta}/*` | Chặn launch |
| 4 | **Thumbnail + video TED của Sal Khan** ở section "See the product surface" → bấm play ra talk về Khanmigo | `assets/ted/*` + lightbox YouTube | Chặn launch |
| 5 | 3 avatar testimonial là ảnh người thật của Khanmigo | `assets/testimonials/*` | Chặn launch |
| 6 | `og:image` + favicon vẫn là ảnh thương hiệu Khan | `assets/brand/66185173…Frame 625094.png`, `assets/icons/KA_Favicon_*` | Chặn launch |
| 7 | Badge "New" + icon external-link vẫn nằm trên nav item "Safety" (di sản của pill "Writing Coach") | nav markup | Nhỏ |
| 8 | Nav dropdown items và phần lớn CTA trỏ `href="#"` vì route AgentKid chưa tồn tại | toàn trang | Cần nối route thật |

Cách xử lý 1–6 mà **không** phải sửa HTML: chỉ cần **thay file trong `assets/<khu vực>/`**,
giữ nguyên tên file và đúng tỉ lệ khung (và giữ đủ biến thể `-p-500/-p-800/…` cho `srcset`).

Riêng #2: nếu chưa có social proof thật, nên **gỡ hẳn khối endorsers** thay vì để logo báo chí
đứng cạnh sản phẩm mình.

Riêng #5: 3 slide hiện là "Design principle" — đúng sự thật nhưng không phải testimonial.
Khi có quote thật thì thay, hoặc gỡ section.

## Đổi copy sau này

1. Sửa `content/agentkid-content.mjs` (`find` / `en` / `vi`).
2. `node scripts/swap-content.mjs` — script tự báo lỗi nếu `find` không khớp.
3. `node scripts/p2-verify.mjs` để kiểm lại.

Hoặc build lại từ đầu: `node scripts/build.mjs` (mirror + swap), hoặc
`node scripts/build.mjs --skip-mirror` (chỉ swap, không cần mạng).
