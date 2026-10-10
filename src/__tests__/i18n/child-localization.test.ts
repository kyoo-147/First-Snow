import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getNamespaceCatalog, lookupKey } from "@/i18n/catalog";
import { t } from "@/i18n";

describe("Wave 2 Child UI Localization Catalog", () => {
  it("child catalog has required keys for login and PIN pad", () => {
    const catalog = getNamespaceCatalog("child", "vi");
    expect(lookupKey(catalog, "login.title")).toBeDefined();
    expect(lookupKey(catalog, "login.enterPin")).toBeDefined();
    expect(lookupKey(catalog, "login.pinMismatch")).toBeDefined();
    expect(lookupKey(catalog, "login.guardianSignInRequired")).toBeDefined();
    expect(lookupKey(catalog, "login.digitAria")).toBeDefined();
    expect(lookupKey(catalog, "login.clearPin")).toBeDefined();
    expect(lookupKey(catalog, "login.backspace")).toBeDefined();
  });

  it("child catalog has navigation, home, routine, activities, and preferences keys", () => {
    const catalog = getNamespaceCatalog("child", "vi");
    expect(lookupKey(catalog, "nav.companion")).toBeDefined();
    expect(lookupKey(catalog, "nav.parentPortal")).toBeDefined();
    expect(lookupKey(catalog, "home.heroTitle")).toBeDefined();
    expect(lookupKey(catalog, "home.readyNext")).toBeDefined();
    expect(lookupKey(catalog, "routine.title")).toBeDefined();
    expect(lookupKey(catalog, "routine.readyNow")).toBeDefined();
    expect(lookupKey(catalog, "activities.howAreYouFeeling")).toBeDefined();
    expect(lookupKey(catalog, "preferences.title")).toBeDefined();
    expect(lookupKey(catalog, "rightRail.lessonHelpTitle")).toBeDefined();
    expect(lookupKey(catalog, "rightRail.privateTitle")).toBeDefined();
    expect(lookupKey(catalog, "explore.featuredTitle")).toBeDefined();
    expect(lookupKey(catalog, "explore.topics.math")).toBeDefined();
    expect(lookupKey(catalog, "explore.paths.mathExplorerTitle")).toBeDefined();
  });

  it("learning catalog has runner and catalog keys", () => {
    const catalog = getNamespaceCatalog("learning", "vi");
    expect(lookupKey(catalog, "catalog.pickLesson")).toBeDefined();
    expect(lookupKey(catalog, "runner.completedTitle")).toBeDefined();
    expect(lookupKey(catalog, "runner.checkAnswer")).toBeDefined();
    expect(lookupKey(catalog, "runner.finish")).toBeDefined();
    expect(lookupKey(catalog, "runner.audioPromptAria")).toBeDefined();
    expect(lookupKey(catalog, "runner.saving")).toBeDefined();
    expect(lookupKey(catalog, "runner.saved")).toBeDefined();
  });

  it("companion catalog has talk, avatar, wrapper, and shell keys", () => {
    const catalog = getNamespaceCatalog("companion", "vi");
    expect(lookupKey(catalog, "talk.title")).toBeDefined();
    expect(lookupKey(catalog, "talk.howAreYouFeeling")).toBeDefined();
    expect(lookupKey(catalog, "talk.tapToTalk")).toBeDefined();
    expect(lookupKey(catalog, "talk.timedOut")).toBeDefined();
    expect(lookupKey(catalog, "avatar.backToApp")).toBeDefined();
    expect(lookupKey(catalog, "wrapper.initializing")).toBeDefined();
    expect(lookupKey(catalog, "shell.openEmojiPicker")).toBeDefined();
    expect(lookupKey(catalog, "shell.stageAlt")).toBeDefined();
    expect(lookupKey(catalog, "shell.subtitles.listening")).toBeDefined();
    expect(lookupKey(catalog, "shell.tabs.general")).toBeDefined();
    expect(lookupKey(catalog, "shell.fields.language")).toBeDefined();
  });

  it("typed t() lookups return valid Vietnamese strings without sentinel", () => {
    expect(t("child", "login.title")).not.toContain("child:");
    expect(t("learning", "catalog.pickLesson")).not.toContain("learning:");
    expect(t("companion", "talk.title")).not.toContain("companion:");
    expect(t("common", "cancel")).not.toContain("common:");
    expect(t("common", "save")).not.toContain("common:");
  });

  it("asserts exact representative Vietnamese values for child login and home", () => {
    expect(t("child", "login.title")).toBe("Chào mừng bạn nhỏ!");
    expect(t("child", "login.enterPin")).toBe("Nhập mã PIN bí mật 4 chữ số của bạn");
    expect(t("child", "login.digitAria", { digit: 5 })).toBe("Số 5");
    expect(t("child", "login.clearPin")).toBe("Xóa mã PIN");
    expect(t("child", "login.backspace")).toBe("Xóa lùi");
    expect(t("child", "login.pinDigitsAria", { entered: 2, total: 4 })).toBe("2 trên 4 chữ số đã nhập");
    expect(t("child", "home.readyNext")).toBe("Sẵn sàng tiếp theo");
    expect(t("child", "home.talkAction")).toBe("Trò chuyện cùng AgentKid");
    expect(t("child", "home.heroTitle")).toBe("Bắt đầu cùng AgentKid, rồi chọn một bước nhỏ tiếp theo nhé.");
  });

  it("asserts exact representative Vietnamese values for explore screen", () => {
    expect(t("child", "explore.title")).toBe("Khám phá");
    expect(t("child", "explore.featuredTitle")).toBe("Khám phá đại dương");
    expect(t("child", "explore.topics.math")).toBe("Toán học");
    expect(t("child", "explore.topics.english")).toBe("Tiếng Anh");
    expect(t("child", "explore.paths.mathExplorerTitle")).toBe("Nhà thám hiểm toán học");
    expect(t("child", "explore.paths.readingExplorerTitle")).toBe("Nhà thám hiểm đọc sách");
    expect(t("child", "explore.adventures.spaceTitle")).toBe("Hành trình vũ trụ");
  });

  it("asserts exact representative Vietnamese values for lesson runner", () => {
    expect(t("learning", "runner.checkAnswer")).toBe("Kiểm tra câu trả lời");
    expect(t("learning", "runner.finish")).toBe("Hoàn thành bài học");
    expect(t("learning", "runner.audioPromptAria")).toBe("Nghe câu hỏi");
    expect(t("learning", "runner.stepCount", { current: 1, total: 5 })).toBe("Bước 1 trên 5");
    expect(t("learning", "runner.saving")).toBe("Đang lưu...");
    expect(t("learning", "runner.saved")).toBe("Đã lưu");
    expect(t("learning", "runner.retrySave")).toBe("Thử lưu lại");
  });

  it("asserts exact representative Vietnamese values for companion settings and shell", () => {
    expect(t("companion", "shell.openEmojiPicker")).toBe("Mở bảng chọn biểu tượng cảm xúc");
    expect(t("companion", "shell.stageAlt")).toBe("AgentKid trong lớp học ấm áp");
    expect(t("companion", "shell.tabs.general")).toBe("Chung");
    expect(t("companion", "shell.tabs.live2d")).toBe("Live2D");
    expect(t("companion", "shell.tabs.asr")).toBe("Nhận diện giọng nói");
    expect(t("companion", "shell.tabs.tts")).toBe("Giọng đọc");
    expect(t("companion", "shell.tabs.agent")).toBe("Trợ lý");
    expect(t("companion", "shell.tabs.about")).toBe("Giới thiệu");
    expect(t("companion", "shell.fields.language")).toBe("Ngôn ngữ");
    expect(t("companion", "shell.fields.version")).toBe("Phiên bản");
    expect(t("companion", "shell.fields.privacyNotes")).toBe("Chính sách quyền riêng tư");
    expect(t("companion", "shell.fields.safetyDisclaimer")).toBe("Tuyên bố an toàn");
    expect(t("companion", "shell.subtitles.listening")).toBe("Chào bạn, đã sẵn sàng cùng học chưa?");
    expect(t("companion", "shell.subtitles.thinking")).toBe("AgentKid đang suy nghĩ một bước nhỏ tiếp theo thật nhẹ nhàng.");
    expect(t("companion", "shell.subtitles.speaking")).toBe("Cùng thử nào. Bạn có thể làm từ từ, không cần vội.");
    expect(t("companion", "shell.subtitles.connectionLost")).toBe("AgentKid đang cố gắng kết nối lại.");
    expect(t("companion", "talk.timedOut")).toBe("Yêu cầu đã quá thời gian chờ.");
    expect(t("common", "save")).toBe("Lưu");
    expect(t("common", "cancel")).toBe("Hủy");
  });

  it("verifies source contract: companion-shell renders tabs/fields through catalog and has no raw Open emoji picker", () => {
    const filePath = path.resolve(process.cwd(), "src/components/companion/companion-shell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // No hardcoded English emoji picker aria-label
    expect(content).not.toContain('aria-label="Open emoji picker"');
    expect(content).toContain('aria-label={t("companion", "shell.openEmojiPicker")}');

    // Tab buttons use tabLabelKeyMap
    expect(content).toContain('t("companion", tabLabelKeyMap[tab])');

    // Setting fields use fieldLabelKeyMap
    expect(content).toContain('t("companion", fieldKey)');

    // Save and cancel use common or shell catalog
    expect(content).toContain('{t("common", "cancel")}');
    expect(content).toContain('{t("common", "save")}');
  });

  it("verifies source contract: home-screen uses t() for readyNext", () => {
    const filePath = path.resolve(process.cwd(), "src/components/pages/home-screen.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain('<p className="text-xs font-black text-snow-primary">Sẵn sàng tiếp theo</p>');
    expect(content).toContain('{t("child", "home.readyNext")}');
  });

  it("verifies source contract: explore-screen uses t() for topics, paths, adventures, and featured collection", () => {
    const filePath = path.resolve(process.cwd(), "src/components/pages/explore-screen.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('t("child", "explore.topics.english")');
    expect(content).toContain('t("child", "explore.paths.readingExplorerTitle")');
    expect(content).toContain('t("child", "explore.adventures.oceanTitle")');
    expect(content).toContain('t("child", "explore.featuredTitle")');
    expect(content).toContain('t("child", "explore.featuredDescription")');
  });

  it("verifies source contract: talk-shell does not have unlocalized timeout error", () => {
    const filePath = path.resolve(process.cwd(), "src/components/companion/talk-shell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).not.toContain('_error: "Request timed out"');
    expect(content).toContain('t("companion", "talk.timedOut")');
  });

  it("verifies accessibility and localization contracts in child login page", () => {
    const filePath = path.resolve(process.cwd(), "src/app/(auth)/child-login/page.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('eyebrow={t("child", "login.eyebrow")}');
    expect(content).toContain('title={t("child", "login.title")}');
    expect(content).toContain('subtitle={t("child", "login.subtitle")}');
    expect(content).toContain('mascotSpeech={t("child", "login.mascotSpeech")}');
    expect(content).toContain('{t("child", "login.loading")}');
  });

  it("verifies accessibility contracts in interactive lesson runner", () => {
    const filePath = path.resolve(process.cwd(), "src/components/learning/interactive-lesson-runner.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('aria-label={t("learning", "runner.audioPromptAria")}');
    expect(content).toContain('aria-checked={isSelected}');
    expect(content).toContain('{t("learning", "runner.checkAnswer")}');
    expect(content).toContain('{t("learning", "runner.finish")}');
  });

  it("verifies accessibility contracts in companion shell and controls", () => {
    const filePath = path.resolve(process.cwd(), "src/components/companion/companion-shell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('aria-label={t("companion", "shell.toggleMic")}');
    expect(content).toContain('aria-label={t("companion", "shell.muteAgentKid")}');
    expect(content).toContain('aria-label={t("companion", "shell.stopAgentKid")}');
    expect(content).toContain('aria-label={t("companion", "shell.openEmojiPicker")}');
    expect(content).toContain('aria-label={t("companion", "shell.closeSettings")}');
    expect(content).toContain('aria-label={t("companion", "shell.childMode")}');
    expect(content).toContain('aria-label={t("companion", "shell.helpAria")}');
    expect(content).toContain('alt={t("companion", "shell.stageAlt")}');
    expect(content).toContain('role="switch"');
    expect(content).toContain('aria-checked="true"');
    expect(content).toContain('aria-pressed={activeTab === tab}');
  });

  it("verifies accessibility contracts in talk shell", () => {
    const filePath = path.resolve(process.cwd(), "src/components/companion/talk-shell.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    expect(content).toContain('role="status"');
    expect(content).toContain('aria-busy="true"');
    expect(content).toContain('role="log"');
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain('aria-label={t("companion", "talk.voiceDisabledAria")}');
    expect(content).toContain('aria-label={t("companion", "talk.tapToTalk")}');
    expect(content).toContain('aria-label={t("companion", "talk.sendAria")}');
  });
});
