const criticalKeywords = ["tự làm đau", "muốn chết", "đánh con", "nguy hiểm"];
const warningKeywords = ["sợ", "đau", "khóc", "mệt", "không muốn"];

export function evaluateConversationRisk(message: string, emotionHistory: Array<{ emotion: string; confidence: number }> = []) {
  const normalized = message.toLowerCase();
  const hasCriticalKeyword = criticalKeywords.some((keyword) => normalized.includes(keyword));
  const hasWarningKeyword = warningKeywords.some((keyword) => normalized.includes(keyword));
  const sustainedFear = emotionHistory.filter((event) => event.emotion === "fearful" && event.confidence >= 0.7).length >= 2;

  if (hasCriticalKeyword || sustainedFear) {
    return {
      triggered: true,
      severity: "critical" as const,
      triggerType: hasCriticalKeyword ? "keyword" as const : "emotion" as const,
      channels: ["push", "sms", "zalo"],
      message: "Critical signal detected during child session."
    };
  }

  if (hasWarningKeyword) {
    return {
      triggered: true,
      severity: "warning" as const,
      triggerType: "keyword" as const,
      channels: ["push"],
      message: "Warning signal detected during child session."
    };
  }

  return {
    triggered: false
  };
}

export function buildFallbackMiaResponse(message: string) {
  if (message.trim().length === 0) {
    return "Mình bắt đầu bằng một câu thật ngắn nhé.";
  }

  return "Mia nghe rồi. Mình thử nói chậm lại một chút nhé, con đang làm rất tốt.";
}
