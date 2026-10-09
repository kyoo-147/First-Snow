import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..');
const localesDir = join(srcDir, 'locales');

function loadLocale(lng) {
  return JSON.parse(readFileSync(join(localesDir, lng, 'translation.json'), 'utf8'));
}

function readSrc(rel) {
  return readFileSync(join(srcDir, rel), 'utf8');
}

// Flatten nested JSON into a set of dotted key paths. Arrays are treated as leaf values.
function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

const vi = loadLocale('vi');
const en = loadLocale('en');
const zh = loadLocale('zh');

test('all three VTuber locale catalogs parse as JSON', () => {
  assert.ok(vi && en && zh);
});

test('vi/en/zh catalogs have identical key sets (parity)', () => {
  const viKeys = flatten(vi);
  const enKeys = flatten(en);
  const zhKeys = flatten(zh);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), 'en must match vi keys');
  assert.deepEqual([...zhKeys].sort(), [...viKeys].sort(), 'zh must match vi keys');
});

test('vi catalog contains representative visible/aria/placeholder translations', () => {
  assert.equal(vi.kid.dashboard, 'Bảng điều khiển');
  assert.equal(vi.kid.searchPlaceholder, 'Tìm kiếm...');
  assert.equal(vi.kid.searchAnything, 'Tìm kiếm bất cứ điều gì');
  assert.equal(vi.titleBar.close, 'Đóng');
  assert.equal(vi.titleBar.exitFullScreen, 'Thoát toàn màn hình');
  assert.equal(vi.electron.typeYourMessage, 'Nhập tin nhắn của bạn...');
  assert.equal(vi.electron.interrupt, 'Ngắt');
  assert.equal(vi.auth.title, 'Đăng nhập qua Snow');
  assert.equal(vi.auth.continue, 'Tiếp tục đến đăng nhập trẻ em');
  assert.equal(vi.profiles.momoLogo, 'Biểu tượng Momo');
  assert.equal(vi.profiles.securePrivate, 'Bảo mật & Riêng tư');
  assert.equal(vi.wsStatus.cameraFailClosed, '📷 Camera: Fail-Closed');
  assert.equal(vi.wsStatus.modelAbsentLabel, '👤 Mô hình đại diện không có (Chế độ giọng nói)');
  assert.equal(vi.live2d.talking, 'AgentKid đang nói...');
  assert.equal(vi.chat.me, 'Tôi');
  assert.equal(vi.chat.ai, 'AI');
  assert.equal(vi.chat.usingTool, '{{name}} đang dùng công cụ {{tool}}');
  assert.equal(vi.chat.usedTool, '{{name}} đã dùng công cụ {{tool}}');
  assert.equal(vi.ui.avatarAlt, 'Ảnh đại diện');
  assert.equal(vi.ui.backgroundAlt, 'Hình nền');
  assert.equal(vi.ui.close, 'Đóng');
  assert.equal(vi.ui.toggleColorMode, 'Chuyển đổi chế độ màu');
  assert.equal(vi.sidebar.petModeUnavailable, 'Chế độ thú cưng không khả dụng');
  assert.equal(vi.sidebar.petModeDesktopOnly, 'Chế độ thú cưng chỉ có sẵn trong ứng dụng máy tính');
  assert.equal(vi.sidebar.modeMenu, 'Trình đơn chế độ');
  assert.equal(vi.footer.raiseHand, 'Giơ tay');
  assert.equal(vi.footer.attachFile, 'Đính kèm tệp');
  assert.equal(vi.error.unableToAccessCamera, 'Không thể truy cập camera');
  assert.equal(vi.error.cameraGrantRequired, 'Camera không khả dụng: yêu cầu cấp quyền từ máy chủ (cần sự đồng ý của phụ huynh và chính sách an toàn)');
  assert.equal(vi.error.screenGrantRequired, 'Chia sẻ màn hình không khả dụng: yêu cầu cấp quyền từ máy chủ (cần sự đồng ý của phụ huynh và chính sách an toàn)');
  assert.equal(vi.error.micGrantRequired, 'Microphone không khả dụng: yêu cầu cấp quyền từ máy chủ');
  assert.equal(vi.kid.documentsParentReports, 'Tài liệu & Báo cáo phụ huynh');
  assert.equal(vi.kid.analyticsEqTitle, 'Bảng điều khiển Phân tích & Phát triển EQ');
  assert.equal(vi.kid.assistantsPlayground, 'Sân chơi Trợ lý AI');
  assert.equal(vi.kid.hostLabel, 'Chủ trì:');
  assert.equal(vi.kid.eventTypeLiveChat, 'Trò chuyện trực tiếp Momo');
  assert.equal(vi.kid.eventTypeBedtimeStory, 'Giờ kể chuyện trước giấc ngủ');
  assert.equal(vi.kid.roleEmotionalCompanion, 'Bạn đồng hành cảm xúc AI (Live2D)');
  assert.equal(vi.kid.roleLanguageTutor, 'Gia sư ngôn ngữ AI');
  assert.equal(vi.kid.companionActive, 'Đang hoạt động');
  assert.equal(vi.kid.companionResting, 'Nghỉ ngơi');
  assert.equal(vi.kid.companionOffline, 'Ngoại tuyến');
  assert.equal(vi.kid.coursesTitle, 'Bài học tương tác');
  assert.equal(vi.kid.filterAllLessons, 'Tất cả bài học');
  assert.equal(vi.kid.rec1Title, 'Hít thở sâu');
  assert.equal(vi.kid.lesson1Title, 'Đánh răng');
  assert.ok(Array.isArray(vi.kid.unlockBullets));
  assert.equal(vi.kid.unlockBullets.length, 6);
});

test('wired VTuber components use the i18next translation hook', () => {
  const wired = [
    'components/kid/ModeSelectionScreen.tsx',
    'components/kid/DashboardLayout.tsx',
    'components/kid/AuthScreen.tsx',
    'components/kid/ChildProfilesScreen.tsx',
    'components/electron/title-bar.tsx',
    'components/electron/input-subtitle.tsx',
    'components/canvas/live2d.tsx',
    'components/canvas/ws-status.tsx',
    'components/sidebar/chat-bubble.tsx',
    'components/sidebar/sidebar.tsx',
    'components/footer/footer.tsx',
    'components/sidebar/camera-panel.tsx',
    'components/sidebar/screen-panel.tsx',
    'components/sidebar/browser-panel.tsx',
    'components/ui/color-mode.tsx',
    'components/ui/close-button.tsx',
    'components/sidebar/chat-history-panel.tsx',
    'components/canvas/background.tsx',
    'hooks/sidebar/use-camera-panel.ts',
    'hooks/utils/use-mic-toggle.ts',
    'context/mode-context.tsx',
    'components/kid/pages/AiTeachersPage.tsx',
    'components/kid/pages/AiWriterPage.tsx',
    'components/kid/pages/AnalyticsPage.tsx',
    'components/kid/pages/AssistantsPage.tsx',
    'components/kid/pages/DashboardPage.tsx',
    'components/kid/pages/DocumentsPage.tsx',
    'components/kid/pages/EventsPage.tsx',
    'components/kid/pages/SpeechToTextPage.tsx',
    'components/kid/pages/VoiceoverPage.tsx',
  ];
  for (const rel of wired) {
    const src = readSrc(rel);
    assert.ok(src.includes('useTranslation'), `${rel} should use useTranslation`);
  }
});

test('wired components no longer contain former hardcoded English or Vietnamese literals', () => {
  const checks = [
    ['components/kid/ModeSelectionScreen.tsx', 'placeholder="Search anything"'],
    ['components/kid/ModeSelectionScreen.tsx', 'placeholder="Placeholder"'],
    ['components/kid/ModeSelectionScreen.tsx', 'alt="Momo Mascot"'],
    ['components/kid/DashboardLayout.tsx', 'placeholder="Search anything"'],
    ['components/kid/AuthScreen.tsx', 'Sign in through Snow'],
    ['components/kid/ChildProfilesScreen.tsx', 'alt="Momo Logo"'],
    ['components/electron/title-bar.tsx', 'aria-label="Minimize"'],
    ['components/electron/input-subtitle.tsx', 'placeholder="Type your message..."'],
    ['components/canvas/live2d.tsx', 'AgentKid is talking...'],
    ['components/canvas/ws-status.tsx', 'Avatar Model Absent (Voice Mode)'],
    ['components/sidebar/chat-bubble.tsx', "'Me'"],
    ['components/footer/footer.tsx', 'aria-label="Raise hand"'],
    ['components/sidebar/sidebar.tsx', 'aria-label="Mode Menu"'],
    ['components/sidebar/camera-panel.tsx', 'Camera Unavailable'],
    ['components/sidebar/screen-panel.tsx', 'Screen Sharing Unavailable'],
    ['components/sidebar/browser-panel.tsx', '"Interactive browser view"'],
    ['components/ui/color-mode.tsx', 'aria-label="Toggle color mode"'],
    ['components/ui/close-button.tsx', 'aria-label="Close"'],
    ['components/sidebar/chat-history-panel.tsx', 'const userName = "Me"'],
    ['components/sidebar/chat-history-panel.tsx', 'is using tool'],
    ['components/sidebar/chat-history-panel.tsx', 'used tool'],
    ['components/sidebar/chat-history-panel.tsx', "confName || 'AI'"],
    ['components/sidebar/chat-history-panel.tsx', 'alt="avatar"'],
    ['components/canvas/background.tsx', 'alt="background"'],
    ['hooks/sidebar/use-camera-panel.ts', 'Camera unavailable: server capability grant required'],
    ['hooks/sidebar/use-camera-panel.ts', "'Unable to access camera'"],
    ['hooks/utils/use-mic-toggle.ts', 'Microphone unavailable: server capability grant required'],
    ['context/mode-context.tsx', '"Pet mode unavailable"'],
    ['context/mode-context.tsx', '"Pet mode is only available in the desktop application"'],
    ['components/kid/pages/DashboardPage.tsx', '>Thời lượng sử dụng<'],
    ['components/kid/pages/DocumentsPage.tsx', '>Quản lý thời gian & Quyền riêng tư<'],
    ['components/kid/pages/EventsPage.tsx', '>Lịch hoạt động & Sự kiện học tập<'],
    ['components/kid/pages/SpeechToTextPage.tsx', '>Phòng luyện nói cùng Momo AI<'],
    ['components/kid/pages/VoiceoverPage.tsx', '>Phòng tạo giọng nói Momo AI<'],
  ];
  for (const [rel, needle] of checks) {
    const src = readSrc(rel);
    assert.ok(!src.includes(needle), `${rel} should not contain ${JSON.stringify(needle)}`);
  }
});
