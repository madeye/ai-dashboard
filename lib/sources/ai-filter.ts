// 中日韩综合媒体的 feed 不限于 AI 内容，用关键词过滤保持看板聚焦。
// ASCII 关键词按词边界匹配（避免 "said" 命中 "ai"），CJK 关键词直接子串匹配。
const ASCII_KEYWORDS = [
  "ai",
  "llm",
  "gpt",
  "aigc",
  "agi",
  "openai",
  "anthropic",
  "claude",
  "gemini",
  "deepseek",
  "qwen",
  "copilot",
  "sora",
  "midjourney",
  "transformer",
  "chatbot",
];

const CJK_KEYWORDS = [
  // 中文
  "人工智能",
  "大模型",
  "大语言模型",
  "智能体",
  "具身智能",
  "机器学习",
  "深度学习",
  "神经网络",
  "多模态",
  "机器人",
  // 日语
  "人工知能",
  "機械学習",
  "深層学習",
  "生成AI",
  "大規模言語モデル",
  "ディープラーニング",
  "マルチモーダル",
  "ロボット",
  // 韩语
  "인공지능",
  "머신러닝",
  "딥러닝",
  "생성형",
  "챗봇",
  "로봇",
  "멀티모달",
  "에이전트",
];

const ASCII_PATTERN = new RegExp(`\\b(${ASCII_KEYWORDS.join("|")})\\b`, "i");

/** 判断标题是否与 AI 相关。 */
export function isAiRelated(text: string): boolean {
  if (ASCII_PATTERN.test(text)) return true;
  return CJK_KEYWORDS.some((keyword) => text.includes(keyword));
}
