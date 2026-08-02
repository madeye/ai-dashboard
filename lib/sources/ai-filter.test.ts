import { test } from "node:test";
import assert from "node:assert/strict";
import { isAiRelated } from "@/lib/sources/ai-filter";

test("matches ASCII keywords on word boundaries", () => {
  assert.equal(isAiRelated("OpenAI 发布新模型"), true);
  assert.equal(isAiRelated("GPT-5.6 价格下调"), true);
  // "said"/"again" 等英文单词不应命中 "ai"
  assert.equal(isAiRelated("He said it again and again"), false);
});

test("matches Chinese keywords", () => {
  assert.equal(isAiRelated("WAIC 收官：AI 究竟重写了什么？"), true);
  assert.equal(isAiRelated("国内唯一做多模态长记忆的公司，融资数千万"), true);
  assert.equal(isAiRelated("Prada集团上半年营收增长16%"), false);
  assert.equal(isAiRelated("国内航线燃油附加费将再次下调"), false);
});

test("matches Japanese keywords", () => {
  assert.equal(isAiRelated("生成AIの導入事例を紹介"), true);
  assert.equal(isAiRelated("人型ロボットが高度な全身制御を実現"), true);
  assert.equal(isAiRelated("プロ野球の試合結果"), false);
});

test("matches Korean keywords", () => {
  assert.equal(isAiRelated("EU, AI 챗봇·딥페이크 표기 의무화"), true);
  assert.equal(isAiRelated("생성형 인공지능 시장 전망"), true);
  assert.equal(isAiRelated("프리미어리그 경기 결과"), false);
});
