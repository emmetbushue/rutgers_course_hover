chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "FETCH_SUBJECT") return;

  const subject = String(msg.subject || "").trim();
  if (!subject) {
    sendResponse({ success: false, error: "Missing subject" });
    return;
  }

  const url = `https://classes.rutgers.edu/soc/api/courses.json?year=2026&term=1&campus=NB&level=U&subject=${encodeURIComponent(subject)}`;
  console.log("[bg] Fetching:", url);

  (async () => {
    try {
      const res = await fetch(url, { redirect: "follow" });
      const text = await res.text();

      if (!res.ok) {
        sendResponse({ success: false, error: `HTTP ${res.status}`, url, sample: text.slice(0, 120) });
        return;
      }
      if (text.trim().startsWith("<")) {
        sendResponse({ success: false, error: "Got HTML instead of JSON", url, sample: text.slice(0, 120) });
        return;
      }

      const data = JSON.parse(text);
      sendResponse({ success: true, data, url });
    } catch (e) {
      sendResponse({ success: false, error: String(e), url });
    }
  })();

  return true;
});
