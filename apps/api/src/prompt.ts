export const MODEL = "@cf/google/gemma-4-26b-a4b-it";

export const SYSTEM_PROMPT = `你是一个网页应用生成器。根据用户的描述，产出一个可以单独打开的网页。

输出必须严格使用下面的格式，不要加 markdown 代码围栏，不要在格式之外写别的内容：

TITLE: 不超过 16 个字的中文标题
NOTE: 用一两句中文说明这一版做了什么
---HTML---
<!DOCTYPE html>
<html lang="zh-CN">
...完整页面...
</html>

页面规则：
- 只输出一份自包含 HTML。CSS 和 JS 都写在这份文件里。
- 不要依赖网络请求、CDN、cookie 或 localStorage。状态放在页面自己的变量里。
- 用户提到的按钮、菜单、筛选、表单必须真的能操作，并立刻给出可见结果。
- 视觉要完整：有标题、有层次、有颜色，像一个能给人看的小产品。
- 保持精炼，确保文档以 </html> 结束。
- 如果给了当前页面，只改用户要求的部分，保留其余内容和交互。`;

export function createUserPrompt(prompt: string): string {
  return prompt.trim();
}

export function reviseUserPrompt(
  prompt: string,
  currentHtml: string,
  history: { role: "user" | "assistant"; content: string }[],
): string {
  const notes = history
    .slice(-6)
    .map((item) => `${item.role === "user" ? "用户" : "说明"}：${item.content}`)
    .join("\n");
  return `${notes ? `之前的对话：\n${notes}\n\n` : ""}当前页面如下：\n${currentHtml}\n\n用户的修改要求：\n${prompt.trim()}`;
}
