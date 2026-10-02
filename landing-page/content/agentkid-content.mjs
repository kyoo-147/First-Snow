// ---------------------------------------------------------------------------
// AgentKid content model — Phase 2 text swap
//
// Source of truth for every claim: D:\work\agentkid
//   - AgentKid Website/PRODUCT_WEBSITE_BRIEF.md  (positioning + hero copy + guardrails)
//   - README.md                                   (what is actually implemented)
//   - messages/en|vi/*.json                       (product vocabulary)
//
// Deliberately NOT written (brief §"Không nên nói"):
//   - "AI understands exactly how your child feels"
//   - "treats / improves autism"
//   - "guarantees absolute safety"
//   - "fully personalised", "clinically proven", "real-time danger detection"
//   - the words revolutionary / next-generation / unlock the power of AI
//   - fake KPIs or fabricated testimonials
//
// Each op is a literal find/replace applied to the pristine mirrored document.
// `expect` is the required occurrence count — the build fails loudly on a miss
// so a silent no-op can never ship.
// ---------------------------------------------------------------------------

export const BRAND = "AgentKid";

export const ops = [
  // ===== HEAD ==============================================================
  {
    id: "head.title",
    area: "head",
    find: "<title>Meet Khanmigo: Khan Academy&#x27;s AI-powered teaching assistant &amp; tutor</title>",
    en: `<title>${BRAND} — A safe learning companion for children, with parent oversight</title>`,
    vi: `<title>${BRAND} — Trợ lý học tập an toàn cho trẻ, có phụ huynh giám sát</title>`,
  },
  {
    id: "head.description",
    area: "head",
    find: 'content="Khanmigo, built by nonprofit Khan Academy, is a top-rated AI for education. Save time on prep, tackle homework challenges, and get personalized tutoring."',
    en: `content="${BRAND} is a parent-managed learning companion for children aged 6 to 10. Gentle conversations, short lessons, daily routines and emotion check-ins, with parent oversight and safety checks on every message."`,
    vi: `content="${BRAND} là trợ lý học tập do phụ huynh quản lý, dành cho trẻ từ 6 đến 10 tuổi. Trò chuyện nhẹ nhàng, bài học ngắn, routine hằng ngày và check-in cảm xúc, có phụ huynh giám sát và kiểm tra an toàn trên mỗi tin nhắn."`,
    expect: 3, // description + og:description + twitter:description
  },
  {
    id: "head.ogtitle",
    area: "head",
    find: `content="Meet Khanmigo: Khan Academy&#x27;s AI-powered teaching assistant &amp; tutor"`,
    en: `content="${BRAND} — A safe learning companion for children, with parent oversight"`,
    vi: `content="${BRAND} — Trợ lý học tập an toàn cho trẻ, có phụ huynh giám sát"`,
    expect: 2, // og:title + twitter:title
  },
  {
    id: "head.lang",
    area: "head",
    find: '<html data-wf-domain="www.khanmigo.ai" data-wf-page="660adebd409244054ef8f8e4" data-wf-site="659ee90e075c502b5cc49dae" lang="en">',
    en: '<html data-wf-domain="www.khanmigo.ai" data-wf-page="660adebd409244054ef8f8e4" data-wf-site="659ee90e075c502b5cc49dae" lang="en">',
    vi: '<html data-wf-domain="www.khanmigo.ai" data-wf-page="660adebd409244054ef8f8e4" data-wf-site="659ee90e075c502b5cc49dae" lang="vi">',
  },
  // locale alternates: es/pt -> vi
  {
    id: "head.alternate",
    area: "head",
    find: '<link rel="alternate" hrefLang="es" href="https://www.khanmigo.ai/es"/>',
    en: '<link rel="alternate" hrefLang="vi" href="vi/"/>',
    vi: '<link rel="alternate" hrefLang="en" href="../"/>',
  },
  {
    id: "head.alternate2",
    area: "head",
    find: '<link rel="alternate" hrefLang="pt" href="https://www.khanmigo.ai/pt"/>',
    en: "",
    vi: "",
  },
  {
    id: "head.alternateEn",
    area: "head",
    find: '<link rel="alternate" hrefLang="en" href="https://www.khanmigo.ai/"/>',
    en: '<link rel="alternate" hrefLang="en" href="index.html"/>',
    vi: '<link rel="alternate" hrefLang="vi" href="../index.html"/>',
  },
  {
    id: "head.xdefault",
    area: "head",
    find: '<link rel="alternate" hrefLang="x-default" href="https://www.khanmigo.ai/"/>',
    en: '<link rel="alternate" hrefLang="x-default" href="index.html"/>',
    vi: '<link rel="alternate" hrefLang="x-default" href="../index.html"/>',
  },
  {
    id: "head.canonical",
    area: "head",
    find: '<link href="https://www.khanmigo.ai" rel="canonical"/>',
    en: '<link href="index.html" rel="canonical"/>',
    vi: '<link href="../index.html" rel="canonical"/>',
  },

  // ===== BRAND LINK ========================================================
  {
    id: "nav.brand",
    area: "nav",
    find: '<a href="https://www.khanmigo.ai/" aria-current="page"',
    en: '<a href="index.html" aria-current="page"',
    vi: '<a href="../index.html" aria-current="page"',
  },

  // ===== NAV ===============================================================
  { id: "nav.learners", area: "nav", find: ">Learners</a>", en: ">For children</a>", vi: ">Cho trẻ</a>" },
  { id: "nav.parents", area: "nav", find: ">Parents</a>", en: ">For parents</a>", vi: ">Cho phụ huynh</a>" },
  { id: "nav.writing", area: "nav", find: ">Writing Coach</a>", en: ">Safety</a>", vi: ">An toàn</a>" },
  { id: "nav.districts", area: "nav", find: ">Districts</a>", en: ">Research</a>", vi: ">Nghiên cứu</a>" },
  { id: "nav.offerings", area: "nav", find: "<div>Offerings</div>", en: "<div>Product</div>", vi: "<div>Sản phẩm</div>" },
  { id: "nav.dd.math", area: "nav", find: ">Math</a>", en: ">Chat</a>", vi: ">Trò chuyện</a>" },
  { id: "nav.dd.science", area: "nav", find: ">Science</a>", en: ">Mini lessons</a>", vi: ">Bài học ngắn</a>" },
  { id: "nav.dd.kids", area: "nav", find: ">Khan Kids</a>", en: ">Routines</a>", vi: ">Routine</a>" },
  { id: "nav.dd.sat", area: "nav", find: ">SAT</a>", en: ">Emotion check-in</a>", vi: ">Check-in cảm xúc</a>" },
  { id: "nav.dd.khanmigo", area: "nav", find: ">Khanmigo</a>", en: ">Progress</a>", vi: ">Tiến trình</a>" },
  { id: "nav.about", area: "nav", find: "<div>About</div>", en: "<div>About</div>", vi: "<div>Giới thiệu</div>" },
  {
    id: "nav.dd.mastery",
    area: "nav",
    find: ">Mastery learning</a>",
    en: ">Our approach</a>",
    vi: ">Cách tiếp cận</a>",
  },
  { id: "nav.dd.why", area: "nav", find: ">Why KAD?</a>", en: ">Why AgentKid?</a>", vi: ">Vì sao AgentKid?</a>" },
  {
    id: "nav.cta.hamburger",
    area: "nav",
    find: 'class="button---in-hamburger w-button">Get Khanmigo</a>',
    en: `class="button---in-hamburger w-button">Explore ${BRAND}</a>`,
    vi: `class="button---in-hamburger w-button">Khám phá ${BRAND}</a>`,
  },
  {
    id: "nav.cta.top",
    area: "nav",
    find: 'class="button-copy w-button">Get Khanmigo</a>',
    en: `class="button-copy w-button">Explore ${BRAND}</a>`,
    vi: `class="button-copy w-button">Khám phá ${BRAND}</a>`,
  },
  // NOTE: the language switcher is injected separately (see scripts/swap-content.mjs)
  // so its anchor does not collide with the nav text ops above.

  // ===== HERO ==============================================================
  {
    id: "hero.h1",
    area: "hero",
    find: '<h1 class="x-large-heading">Khanmigo is your always-available</h1>',
    en: '<h1 class="x-large-heading">Small steps for children.</h1>',
    vi: '<h1 class="x-large-heading">Từng bước nhỏ cho trẻ.</h1>',
  },
  {
    id: "hero.words",
    area: "hero",
    find: 'data-words="tutor.,writing coach.,homework helper.,study buddy.,code reviewer.,lesson plan helper.,debate partner.,essay reviewer.,curriculum planner."',
    en: 'data-words="Clear visibility for parents.,Calm and structured.,Built for ages 6 to 10.,Safety checked every message.,Parent-controlled data."',
    vi: 'data-words="Mọi tiến trình rõ ràng với phụ huynh.,Bình tĩnh và có cấu trúc.,Dành cho trẻ 6 đến 10 tuổi.,Kiểm tra an toàn mọi tin nhắn.,Dữ liệu do phụ huynh kiểm soát."',
  },
  {
    id: "hero.typed",
    area: "hero",
    find: 'class="typer">teaching assistant.</span>',
    en: 'class="typer">Clear visibility for parents.</span>',
    vi: 'class="typer">Mọi tiến trình rõ ràng với phụ huynh.</span>',
  },
  // audience cards
  { id: "hero.c1.eyebrow", area: "hero", find: ">For teachers</p>", en: ">For children</p>", vi: ">Cho trẻ</p>" },
  {
    id: "hero.c1.copy",
    area: "hero",
    find: ">Knock something off your to-do list in minutes</p>",
    en: ">Chat, mini lessons, routines and emotion check-ins</p>",
    vi: ">Trò chuyện, bài học ngắn, routine và check-in cảm xúc</p>",
  },
  {
    id: "hero.c1.cta",
    area: "hero",
    find: 'class="button blue-lavender w-button">Sign up for free</a>',
    en: 'class="button blue-lavender w-button">See Kid Mode</a>',
    vi: 'class="button blue-lavender w-button">Xem Kid Mode</a>',
  },
  { id: "hero.c2.eyebrow", area: "hero", find: ">For districts</p>", en: ">For parents</p>", vi: ">Cho phụ huynh</p>" },
  {
    id: "hero.c2.copy",
    area: "hero",
    find: ">Expert-led AI adoption for your schools</p>",
    en: ">Track progress, review memories and check safety alerts</p>",
    vi: ">Theo dõi tiến trình, xem lại memory và kiểm tra cảnh báo an toàn</p>",
  },
  {
    id: "hero.c2.cta",
    area: "hero",
    find: 'class="button white---lavender w-button">Learn more</a>',
    en: 'class="button white---lavender w-button">See Parent Dashboard</a>',
    vi: 'class="button white---lavender w-button">Xem bảng điều khiển phụ huynh</a>',
  },
  { id: "hero.c3.eyebrow", area: "hero", find: ">For writing</p>", en: ">For admins</p>", vi: ">Cho quản trị viên</p>" },
  {
    id: "hero.c3.copy",
    area: "hero",
    find: ">AI-enhanced writing practice and instruction tool</p>",
    en: ">Manage lesson and routine content in one console</p>",
    vi: ">Quản lý nội dung bài học và routine trong một console</p>",
  },
  {
    id: "hero.c3.cta",
    area: "hero",
    find: 'class="button white---lavender w-button">Sign up for free</a>',
    en: 'class="button white---lavender w-button">See Admin Console</a>',
    vi: 'class="button white---lavender w-button">Xem Admin Console</a>',
  },

  // ===== ENDORSERS (trust strip; press logos are images and stay — see docs) =
  {
    id: "endorse.1",
    area: "endorsers",
    find: ">“Forget ChatGPT. These are the best AI-powered apps.”</div>",
    en: ">Designed as a support tool — not a diagnosis and not a replacement for professional care.</div>",
    vi: ">Được thiết kế như công cụ hỗ trợ — không chẩn đoán và không thay thế chuyên gia.</div>",
  },
  {
    id: "endorse.2",
    area: "endorsers",
    find: ">Khanmigo receives an overall 4-star rating making it a top-rated AI-for-education tool.</div>",
    en: ">Every message is checked by deterministic safety rules, on input and on output.</div>",
    vi: ">Mọi tin nhắn đều được kiểm tra bằng các quy tắc an toàn xác định, ở đầu vào và đầu ra.</div>",
  },
  {
    id: "endorse.3",
    area: "endorsers",
    find: ">“One teacher said she noticed students posing more questions to Khanmigo than they might typically ask.”</div>",
    en: ">Parents keep ownership of their child's data and can review or delete saved memories.</div>",
    vi: ">Phụ huynh giữ quyền sở hữu dữ liệu của con và có thể xem lại hoặc xoá memory đã lưu.</div>",
  },

  // ===== VALUE PROP ========================================================
  {
    id: "vp.h2",
    area: "value-prop",
    find: '<h2 class="large-heading">On-demand AI-powered support for education.</h2>',
    en: '<h2 class="large-heading">A calm, structured learning companion for ages 6 to 10.</h2>',
    vi: '<h2 class="large-heading">Trợ lý học tập bình tĩnh, có cấu trúc, dành cho trẻ 6 đến 10 tuổi.</h2>',
  },
  // NOTE: block 3's eyebrow must run BEFORE block 2's, because block 2 rewrites
  // "For learners" -> "For parents" and would otherwise make this anchor ambiguous.
  {
    id: "vp.b3.eyebrow",
    area: "value-prop",
    find: '<strong class="bold-text">For parents</strong>',
    en: '<strong class="bold-text">For safety</strong>',
    vi: '<strong class="bold-text">Về an toàn</strong>',
  },
  // block 1 — child experience
  {
    id: "vp.b1.eyebrow",
    area: "value-prop",
    find: '<strong class="bold-text">For teachers</strong>',
    en: '<strong class="bold-text">For children</strong>',
    vi: '<strong class="bold-text">Cho trẻ</strong>',
  },
  {
    id: "vp.b1.h3",
    area: "value-prop",
    find: '<h3 class="big-heading">Experience the best AI for teachers.</h3>',
    en: '<h3 class="big-heading">Four small activities, one calm space.</h3>',
    vi: '<h3 class="big-heading">Bốn hoạt động nhỏ, một không gian bình tĩnh.</h3>',
  },
  {
    id: "vp.b1.p",
    area: "value-prop",
    find: "<p class=\"paragraph-text\">Built for educators by educators, with your needs in mind. Khanmigo simplifies your workflow while keeping your work and your student data private and secure.</p>",
    en: '<p class="paragraph-text">Kid Mode keeps each day simple: a short conversation, a mini lesson, a routine step and an emotion check-in. The interface stays quiet and predictable so the child always knows what comes next.</p>',
    vi: '<p class="paragraph-text">Kid Mode giữ mỗi ngày thật đơn giản: một đoạn trò chuyện ngắn, một bài học nhỏ, một bước routine và một lần check-in cảm xúc. Giao diện luôn nhẹ và dễ đoán để trẻ biết bước tiếp theo là gì.</p>',
  },
  {
    id: "vp.b1.cta",
    area: "value-prop",
    find: 'class="button w-button">Sign up for free</a>',
    en: `class="button w-button">Explore ${BRAND}</a>`,
    vi: `class="button w-button">Khám phá ${BRAND}</a>`,
  },
  {
    id: "vp.b1.secondary",
    area: "value-prop",
    find: '<a href="https://www.khanmigo.ai/teachers" class="wb-link">Learn more</a>',
    en: '<a href="#" class="wb-link">See Kid Mode</a>',
    vi: '<a href="#" class="wb-link">Xem Kid Mode</a>',
  },
  // block 2 — parent oversight
  {
    id: "vp.b2.eyebrow",
    area: "value-prop",
    find: '<strong class="bold-text">For learners</strong>',
    en: '<strong class="bold-text">For parents</strong>',
    vi: '<strong class="bold-text">Cho phụ huynh</strong>',
  },
  {
    id: "vp.b2.h3",
    area: "value-prop",
    find: '<h3 class="big-heading">Build your brain power.</h3>',
    en: '<h3 class="big-heading">Progress you can see. Data you control.</h3>',
    vi: '<h3 class="big-heading">Tiến trình nhìn thấy được. Dữ liệu do anh chị kiểm soát.</h3>',
  },
  {
    id: "vp.b2.p",
    area: "value-prop",
    find: "<p class=\"paragraph-text\">Khanmigo challenges you to think critically and solve problems without giving you direct answers. Learn new skills anytime, whether it&#x27;s algebra, SQL, or essay writing.</p>",
    en: '<p class="paragraph-text">See completed lessons, routine steps, emotion check-ins and recent sessions in one place. Each child profile is owned by its parent, and saved memories can be reviewed or deleted at any time.</p>',
    vi: '<p class="paragraph-text">Xem bài học đã hoàn thành, các bước routine, check-in cảm xúc và những session gần đây ở cùng một nơi. Mỗi hồ sơ trẻ thuộc quyền sở hữu của phụ huynh, và memory đã lưu có thể được xem lại hoặc xoá bất cứ lúc nào.</p>',
  },
  {
    id: "vp.b2.secondary",
    area: "value-prop",
    find: '<a href="https://www.khanmigo.ai/learners" class="wb-link">Learn more</a>',
    en: '<a href="#" class="wb-link">See Parent Dashboard</a>',
    vi: '<a href="#" class="wb-link">Xem bảng điều khiển phụ huynh</a>',
  },
  // block 3 — safety
  {
    id: "vp.b3.h3",
    area: "value-prop",
    find: '<h3 class="big-heading">Turn homework into high fives.</h3>',
    en: '<h3 class="big-heading">Every message is checked, in and out.</h3>',
    vi: '<h3 class="big-heading">Mọi tin nhắn đều được kiểm tra, cả vào và ra.</h3>',
  },
  {
    id: "vp.b3.p",
    area: "value-prop",
    find: "<p class=\"paragraph-text\">Type in a homework question and get instant help. Like a good tutor, Khanmigo gently guides your child to discover the answers themselves.</p>",
    en: '<p class="paragraph-text">Deterministic safety rules run on both the child\'s message and the reply before anything is stored. Risky content is replaced by a safe fallback and surfaced to the parent as a safety alert.</p>',
    vi: '<p class="paragraph-text">Các quy tắc an toàn xác định chạy trên cả tin nhắn của trẻ và phản hồi trước khi bất cứ nội dung nào được lưu. Nội dung rủi ro được thay bằng phản hồi an toàn và hiển thị cho phụ huynh dưới dạng cảnh báo an toàn.</p>',
  },
  {
    id: "vp.b3.secondary",
    area: "value-prop",
    find: '<a href="https://www.khanmigo.ai/parents" class="wb-link">Learn more</a>',
    en: '<a href="#" class="wb-link">See how safety works</a>',
    vi: '<a href="#" class="wb-link">Xem cách hệ thống bảo vệ trẻ</a>',
  },
  // the two identical primary buttons in value-prop blocks 2 and 3
  {
    id: "vp.b2b3.cta",
    area: "value-prop",
    find: 'class="button w-button">Get Khanmigo</a>',
    en: `class="button w-button">Explore ${BRAND}</a>`,
    vi: `class="button w-button">Khám phá ${BRAND}</a>`,
    expect: 2,
  },

  // ===== SOCIAL PROOF ======================================================
  {
    id: "sp.h2",
    area: "testimonials",
    find: '<h2 class="large-heading">Praise for Khanmigo</h2>',
    en: '<h2 class="large-heading">The principles behind AgentKid</h2>',
    vi: '<h2 class="large-heading">Nguyên tắc đằng sau AgentKid</h2>',
  },
  {
    id: "sp.q1",
    area: "testimonials",
    find: "“Khanmigo&#x27;s Rubric Generator allowed me to incorporate our actual unit plans and objectives to construct a rubric from scratch. A task that would normally take me about an hour was now completed in no more than 15 minutes.”",
    en: "AgentKid is a support tool. It does not diagnose, does not treat, and does not replace a parent, a teacher or a professional.",
    vi: "AgentKid là công cụ hỗ trợ. Hệ thống không chẩn đoán, không điều trị và không thay thế phụ huynh, giáo viên hay chuyên gia.",
  },
  {
    id: "sp.n1",
    area: "testimonials",
    find: "Ms. Bartsch<br/>",
    en: "Design principle<br/>",
    vi: "Nguyên tắc thiết kế<br/>",
  },
  {
    id: "sp.r1",
    area: "testimonials",
    find: '<span class="descriptor-grey">High school English teacher</span>',
    en: '<span class="descriptor-grey">Product scope</span>',
    vi: '<span class="descriptor-grey">Phạm vi sản phẩm</span>',
  },
  {
    id: "sp.q2",
    area: "testimonials",
    find: "&quot;Khanmigo, the GPT-4-powered chatbot by @khanacademy, has been blowing my mind. It&#x27;s SO good! It will walk you through the solution and ask questions so you can work it out yourself rather than just get the answer.”",
    en: "Conversations are checked by deterministic safety rules before a reply is generated, and again before it is stored.",
    vi: "Hội thoại được kiểm tra bằng các quy tắc an toàn xác định trước khi tạo phản hồi, và kiểm tra lại trước khi lưu.",
  },
  {
    id: "sp.n2",
    area: "testimonials",
    find: "Dani Guardiola<br",
    en: "Design principle<br",
    vi: "Nguyên tắc thiết kế<br",
  },
  {
    id: "sp.r2",
    area: "testimonials",
    find: '<span class="descriptor-grey">@daniguardio_la</span>',
    en: '<span class="descriptor-grey">Safety</span>',
    vi: '<span class="descriptor-grey">An toàn</span>',
  },
  {
    id: "sp.q3",
    area: "testimonials",
    find: "&quot;It has completely revolutionized our homeschool. It is perfect for a family that asks ‘why’ constantly. It is so much more time-efficient than trying to piece together intelligent answers from many sources.&quot;",
    en: "What the system remembers about a child is visible to that child's parent, and can be deleted by that parent.",
    vi: "Những gì hệ thống ghi nhớ về trẻ đều hiển thị cho phụ huynh của trẻ đó, và phụ huynh có thể xoá.",
  },
  { id: "sp.n3", area: "testimonials", find: "Katie<br", en: "Design principle<br", vi: "Nguyên tắc thiết kế<br" },
  {
    id: "sp.r3",
    area: "testimonials",
    find: '<span class="descriptor-grey">Homeschool parent</span>',
    en: '<span class="descriptor-grey">Privacy and memory</span>',
    vi: '<span class="descriptor-grey">Quyền riêng tư và memory</span>',
  },

  // ===== FAQ ===============================================================
  { id: "faq.h2", area: "faq", find: '>FAQ</h2>', en: ">FAQ</h2>", vi: ">Câu hỏi thường gặp</h2>" },
  {
    id: "faq.q1",
    area: "faq",
    find: ">What is Khanmigo? How is it different from ChatGPT?</h3>",
    en: `>What is ${BRAND}?</h3>`,
    vi: `>${BRAND} là gì?</h3>`,
  },
  {
    id: "faq.q2",
    area: "faq",
    find: ">How many children can I add to my Khanmigo account?</h3>",
    en: ">Is it a doctor, a therapist or a diagnostic tool?</h3>",
    vi: ">Đây có phải là bác sĩ, chuyên gia trị liệu hay công cụ chẩn đoán?</h3>",
  },
  {
    id: "faq.q3",
    area: "faq",
    find: ">Will I be able to give my students access to Khanmigo?</h3>",
    en: ">How are conversations kept safe?</h3>",
    vi: ">Hội thoại được giữ an toàn như thế nào?</h3>",
  },
  {
    id: "faq.q4",
    area: "faq",
    find: ">Can anyone use Khanmigo?</h3>",
    en: ">What can my child actually do?</h3>",
    vi: ">Con tôi thực sự làm được gì?</h3>",
  },
  {
    id: "faq.q5",
    area: "faq",
    find: ">Why is a payment required to access Khanmigo for parents and learners?</h3>",
    en: ">Who can see my child's data?</h3>",
    vi: ">Ai có thể xem dữ liệu của con tôi?</h3>",
  },
  {
    id: "faq.q6",
    area: "faq",
    find: ">What grades and subjects can Khanmigo help with?</h3>",
    en: ">What ages and languages does it support?</h3>",
    vi: ">Hệ thống hỗ trợ độ tuổi và ngôn ngữ nào?</h3>",
  },

  // ===== VIDEO / product preview ===========================================
  {
    id: "video.h2",
    area: "ted",
    find: '<h2 class="large-heading">Get a glimpse of the future of learning.</h2>',
    en: '<h2 class="large-heading">See the product surface.</h2>',
    vi: '<h2 class="large-heading">Xem giao diện sản phẩm.</h2>',
  },
  {
    id: "video.copy",
    area: "ted",
    find: '<div class="paragraph-text">See Khanmigo in action in Sal Khan&#x27;s 2023 TED Talk.</div>',
    en: '<div class="paragraph-text">A short walkthrough of Kid Mode and the parent dashboard.</div>',
    vi: '<div class="paragraph-text">Hướng dẫn ngắn về Kid Mode và bảng điều khiển phụ huynh.</div>',
  },

  // ===== FOOTER ============================================================
  {
    id: "footer.h2",
    area: "final-cta",
    find: '<h2 class="large-heading white">Experience the best AI-powered tool in education</h2>',
    en: '<h2 class="large-heading white">A safe learning companion, with parent oversight</h2>',
    vi: '<h2 class="large-heading white">Trợ lý học tập an toàn, có phụ huynh giám sát</h2>',
  },
  {
    id: "footer.cta1",
    area: "final-cta",
    find: 'class="large-button white---black w-button">Get Khanmigo</a>',
    en: `class="large-button white---black w-button">Explore ${BRAND}</a>`,
    vi: `class="large-button white---black w-button">Khám phá ${BRAND}</a>`,
  },
  {
    id: "footer.cta2",
    area: "final-cta",
    find: 'class="large-button border-black w-button">Khanmigo for Districts</a>',
    en: 'class="large-button border-black w-button">Request a demo</a>',
    vi: 'class="large-button border-black w-button">Đăng ký xem demo</a>',
  },
  {
    id: "footer.l1",
    area: "final-cta",
    find: 'class="footer-link-white">Visit Khan Academy</a>',
    en: 'class="footer-link-white">Product overview</a>',
    vi: 'class="footer-link-white">Tổng quan sản phẩm</a>',
  },
  {
    id: "footer.l2",
    area: "final-cta",
    find: 'class="footer-link-white">Terms of use</a>',
    en: 'class="footer-link-white">Terms of use</a>',
    vi: 'class="footer-link-white">Điều khoản sử dụng</a>',
  },
  {
    id: "footer.l3",
    area: "final-cta",
    find: 'class="footer-link-white">Privacy Policy</a>',
    en: 'class="footer-link-white">Privacy Policy</a>',
    vi: 'class="footer-link-white">Chính sách bảo mật</a>',
  },
  {
    id: "footer.l4",
    area: "final-cta",
    find: '<div class="footer-link-text">Cookie Notice</div>',
    en: '<div class="footer-link-text">Cookie Notice</div>',
    vi: '<div class="footer-link-text">Thông báo cookie</div>',
  },
  {
    id: "footer.l5",
    area: "final-cta",
    find: '<div class="footer-link-text">Accessibility Statement</div>',
    en: '<div class="footer-link-text">Accessibility Statement</div>',
    vi: '<div class="footer-link-text">Tuyên bố về khả năng tiếp cận</div>',
  },

  // ===== SECOND FAQ ACCORDION (duplicate rendering used by the source) =====
  // Same six questions, different DOM branch. Headings live in div.p1-body.bold,
  // answers in .accordionitem. Order differs from the <ul> accordion — see
  // ACCORDION_ITEM_ORDER below.
  {
    id: "faq2.q3",
    area: "faq",
    find: ">Will I be able to give my students access to Khanmigo?</div>",
    en: ">How are conversations kept safe?</div>",
    vi: ">Hội thoại được giữ an toàn như thế nào?</div>",
  },
  {
    id: "faq2.q1",
    area: "faq",
    find: ">What is Khanmigo? How is it different from ChatGPT?</div>",
    en: `>What is ${BRAND}?</div>`,
    vi: `>${BRAND} là gì?</div>`,
  },
  {
    id: "faq2.q4",
    area: "faq",
    find: ">Can anyone use Khanmigo?</div>",
    en: ">What can my child actually do?</div>",
    vi: ">Con tôi thực sự làm được gì?</div>",
  },
  {
    id: "faq2.q5",
    area: "faq",
    find: ">Why is a payment required to access Khanmigo?</div>",
    en: ">Who can see my child's data?</div>",
    vi: ">Ai có thể xem dữ liệu của con tôi?</div>",
  },
  {
    id: "faq2.q2",
    area: "faq",
    find: ">How many children can I add to my Khanmigo account?</div>",
    en: ">Is it a doctor, a therapist or a diagnostic tool?</div>",
    vi: ">Đây có phải là bác sĩ, chuyên gia trị liệu hay công cụ chẩn đoán?</div>",
  },
  {
    id: "faq2.q6",
    area: "faq",
    find: ">What grades and subjects can Khanmigo help with?</div>",
    en: ">What ages and languages does it support?</div>",
    vi: ">Hệ thống hỗ trợ độ tuổi và ngôn ngữ nào?</div>",
  },
];

// ---------------------------------------------------------------------------
// FAQ answer bodies — replaced wholesale (the source text is Khanmigo-specific
// and cannot be meaningfully edited in place). Matched by nth occurrence of the
// spacer container so no giant literal has to be transcribed.
// ---------------------------------------------------------------------------
export const FAQ_SPACER_PATTERN = /(<div class="accordion-content_spacer">)([\s\S]*?)(<\/div>)/g;

// The source renders the FAQ twice. The second branch uses .accordionitem with
// the same six answers in a DIFFERENT order; this maps its position -> faqAnswers index.
export const ACCORDION_ITEM_PATTERN = /(<div class="accordionitem">)(<div class="p1-body-2">[\s\S]*?<\/div>)/g;
export const ACCORDION_ITEM_ORDER = [2, 0, 3, 4, 1, 5];

export const faqAnswers = [
  {
    en: "<p class=\"p1-body-2\">AgentKid is a learning companion for children aged roughly 6 to 10, built and supervised by a parent. It brings four small, clearly structured activities into one place: a gentle chat, short mini lessons, daily routines and a simple emotion check-in.<br/><br/>A parent creates the child profile, keeps ownership of the data, and can see what happened. AgentKid is designed as a support tool for everyday structure — it is not a medical, diagnostic or therapeutic product.</p>",
    vi: "<p class=\"p1-body-2\">AgentKid là trợ lý đồng hành học tập dành cho trẻ khoảng 6 đến 10 tuổi, do phụ huynh tạo và giám sát. Sản phẩm gom bốn hoạt động nhỏ, có cấu trúc rõ ràng vào một chỗ: trò chuyện nhẹ nhàng, bài học ngắn, routine hằng ngày và một lần check-in cảm xúc đơn giản.<br/><br/>Phụ huynh tạo hồ sơ cho trẻ, giữ quyền sở hữu dữ liệu và xem được những gì đã diễn ra. AgentKid được thiết kế như công cụ hỗ trợ cho nếp sinh hoạt hằng ngày — không phải sản phẩm y tế, chẩn đoán hay trị liệu.</p>",
  },
  {
    en: "<p class=\"p1-body-2\">No. AgentKid is a support tool. It does not diagnose any condition, it does not treat or improve any condition, and it is not a substitute for a parent, a teacher, a doctor or a therapist.<br/><br/>Emotion check-ins are a light self-reporting habit for the child. They are not a clinical measurement, and AgentKid does not claim to know how a child truly feels.<br/><br/>If you have concerns about your child's development or wellbeing, please speak to a qualified professional.</p>",
    vi: "<p class=\"p1-body-2\">Không. AgentKid là công cụ hỗ trợ. Hệ thống không chẩn đoán bất kỳ tình trạng nào, không điều trị hay cải thiện tình trạng nào, và không thay thế phụ huynh, giáo viên, bác sĩ hay chuyên gia trị liệu.<br/><br/>Check-in cảm xúc chỉ là một thói quen tự ghi nhận nhẹ nhàng cho trẻ. Đây không phải phép đo lâm sàng, và AgentKid không khẳng định là biết chính xác cảm xúc thật của trẻ.<br/><br/>Nếu anh chị có lo ngại về sự phát triển hay tình trạng của con, hãy trao đổi với chuyên gia có chuyên môn.</p>",
  },
  {
    en: "<p class=\"p1-body-2\">Every child message and every generated reply passes through deterministic safety rules — fixed, testable checks rather than a model's judgement.<br/><br/>Chat is stored with a full transcript, and a risky message creates a single safety alert for the parent instead of being repeated. When the AI provider is unavailable or returns something that fails the checks, AgentKid falls back to a fixed, child-safe response rather than showing the raw output.<br/><br/>No system can promise absolute safety. AgentKid is built to fail visibly and to keep the parent in the loop.</p>",
    vi: "<p class=\"p1-body-2\">Mọi tin nhắn của trẻ và mọi phản hồi được tạo ra đều đi qua các quy tắc an toàn xác định — tức các kiểm tra cố định, có thể kiểm thử, chứ không dựa vào phán đoán của mô hình.<br/><br/>Hội thoại được lưu kèm đầy đủ transcript, và một nội dung rủi ro chỉ tạo ra một cảnh báo an toàn cho phụ huynh thay vì lặp lại nhiều lần. Khi nhà cung cấp AI không khả dụng hoặc trả về nội dung không đạt kiểm tra, AgentKid dùng phản hồi an toàn cố định thay vì hiển thị nội dung thô.<br/><br/>Không hệ thống nào cam kết an toàn tuyệt đối. AgentKid được xây để lỗi lộ ra rõ ràng và để phụ huynh luôn nắm được tình hình.</p>",
  },
  {
    en: "<p class=\"p1-body-2\">Kid Mode gives the child four things to do, and nothing more:<br/><br/>— Chat: a short, calm conversation.<br/>— Mini lesson: one small lesson, marked complete when done.<br/>— Routine: today's steps, ticked off one at a time.<br/>— Emotion check-in: the child names how they feel, optionally with a short note.<br/><br/>The child never sees other children's data, and cannot change account or billing settings.</p>",
    vi: "<p class=\"p1-body-2\">Kid Mode cho trẻ bốn việc để làm, và chỉ có vậy:<br/><br/>— Trò chuyện: một đoạn hội thoại ngắn, nhẹ nhàng.<br/>— Bài học ngắn: một bài nhỏ, đánh dấu hoàn thành khi xong.<br/>— Routine: các bước của hôm nay, tích từng bước một.<br/>— Check-in cảm xúc: trẻ gọi tên cảm xúc của mình, có thể kèm một ghi chú ngắn.<br/><br/>Trẻ không bao giờ thấy dữ liệu của trẻ khác và không thể thay đổi cài đặt tài khoản hay thanh toán.</p>",
  },
  {
    en: "<p class=\"p1-body-2\">A child profile belongs to the parent who created it. That parent can see the child's lessons, routine steps, emotion check-ins, recent sessions and saved memories — and can delete a memory or acknowledge a safety alert.<br/><br/>Administrators manage lesson and routine content. They can read child-derived records, but write actions on a child are restricted to the owning parent, so one family can never act on another family's data.<br/><br/>Children cannot read or act on each other's records.</p>",
    vi: "<p class=\"p1-body-2\">Hồ sơ của trẻ thuộc về phụ huynh đã tạo hồ sơ đó. Phụ huynh xem được bài học, các bước routine, check-in cảm xúc, session gần đây và memory đã lưu của con — đồng thời có thể xoá memory hoặc xác nhận một cảnh báo an toàn.<br/><br/>Quản trị viên quản lý nội dung bài học và routine. Họ có thể đọc các bản ghi phát sinh từ trẻ, nhưng thao tác ghi lên dữ liệu của trẻ chỉ dành cho phụ huynh sở hữu, nên không gia đình nào tác động được lên dữ liệu của gia đình khác.<br/><br/>Trẻ không thể đọc hay tác động lên bản ghi của trẻ khác.</p>",
  },
  {
    en: "<p class=\"p1-body-2\">AgentKid is aimed at children from roughly 6 to 10 years old, with a parent managing the account.<br/><br/>The product is available in English and Vietnamese. Chat works without network access through a deterministic child-safe fallback, so the four activities still function when no external AI provider is configured.<br/><br/>Voice interaction for Vietnamese children's speech, multimodal emotion recognition and adaptive lesson selection are research directions, not shipped features.</p>",
    vi: "<p class=\"p1-body-2\">AgentKid hướng tới trẻ khoảng 6 đến 10 tuổi, với phụ huynh quản lý tài khoản.<br/><br/>Sản phẩm có tiếng Anh và tiếng Việt. Chat vẫn hoạt động khi không có mạng nhờ phản hồi an toàn cố định, nên bốn hoạt động vẫn dùng được khi chưa cấu hình nhà cung cấp AI bên ngoài.<br/><br/>Tương tác giọng nói cho tiếng Việt của trẻ, nhận diện cảm xúc đa phương thức và chọn bài học thích ứng là hướng nghiên cứu, chưa phải tính năng đã phát hành.</p>",
  },
];

// ---------------------------------------------------------------------------
// Link targets. AgentKid's own routes do not exist in this static mirror yet, so
// every internal/outbound product link is neutralised and recorded for later
// wiring. Khanmigo/Khan Academy destinations must never survive into a page
// that presents itself as AgentKid.
// ---------------------------------------------------------------------------
export const linkNeutralise = [
  "https://www.khanmigo.ai/learners",
  "https://www.khanmigo.ai/parents",
  "https://www.khanmigo.ai/writingcoach",
  "https://www.khanmigo.ai/teachers",
  "https://www.khanacademy.org/",
  "https://www.khanacademy.org/schools",
  "https://www.khanacademy.org/schools/pricing",
  "https://www.khanacademy.org/writing-coach/signup/teacher",
  "https://www.khanacademy.org/about/tos",
  "https://www.khanacademy.org/about/privacy-policy",
  "https://www.khanacademy.org/about/cookie-policy",
  "https://www.khanacademy.org/about/accessibility-statement",
  "https://khanacademy.org/khanmigo/teacher-tools",
  "https://khanacademy.org/khanmigo/checkout",
  "https://districts.khanacademy.org/khanmigo",
];

export const styledLinks = [
  { id: "cta.vp.b2", find: 'class="button w-button">Explore AgentKid</a>', expect: 1 },
  { id: "cta.vp.b3", find: 'class="button w-button">Explore AgentKid</a>', expect: 1 },
];
