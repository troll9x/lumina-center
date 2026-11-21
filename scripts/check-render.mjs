import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import assert from "node:assert/strict";
// Render React components in Node; this is not a browser or screenshot test.
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: App } = await vite.ssrLoadModule("/src/App.tsx");
  const { StoreProvider } = await vite.ssrLoadModule("/src/context.tsx");
  for (const page of [
    "dashboard",
    "students",
    "courses",
    "teachers",
    "finance",
    "warehouse",
    "analysis",
    "agent",
    "settings",
    "history",
  ]) {
    const html = renderToString(
      createElement(StoreProvider, { initialPage: page }, createElement(App)),
    );
    assert(html.includes("Tri Thức Việt"));
    assert(html.includes("<main>"));
    console.log("PASS React render: quản lý / " + page);
  }
  for (const page of ["dashboard", "courses", "lessons", "teachers"]) {
    const html = renderToString(
      createElement(
        StoreProvider,
        { initialPage: page, initialUserId: "ND-GV-1" },
        createElement(App),
      ),
    );
    assert(!html.includes(">Ghi nhận thu<"));
    assert(!html.includes(">Kho dữ liệu<"));
    console.log("PASS React render: giáo viên / " + page);
  }
} finally {
  await vite.close();
}
