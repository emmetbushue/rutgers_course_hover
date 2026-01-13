console.log("Rutgers Course Hover extension loaded");

// Regex for Rutgers course codes like 01:198:211
const courseRegexTest = /\b\d{2}:\d{3}:\d{3}\b/;
const courseRegexReplace = /\b(\d{2}):(\d{3}):(\d{3})\b/g;

// Create tooltip element
const tooltip = document.createElement("div");
tooltip.id = "rutgers-tooltip";
tooltip.style.display = "none";
document.body.appendChild(tooltip);

// Cache for course data
const courseCache = new Map();

// Function to safely wrap course codes in spans
function wrapCourseCodes() {
  const walker = document.createTreeWalker(
    document.body, 
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentNode;
        if (!parent || !(parent instanceof Element)) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "NOSCRIPT", "HEAD", "TITLE"].includes(parent.nodeName)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest("#rutgers-tooltip")) return NodeFilter.FILTER_REJECT;
        if (parent.classList?.contains("rutgers-course")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodesToReplace = [];
  let node;

  while ((node = walker.nextNode())) {
    const text = node.nodeValue;
    if (text && courseRegexTest.test(text)) {
      nodesToReplace.push(node);
    }
  }

  // Reset regex lastIndex

  // Replace nodes
  nodesToReplace.forEach(node => {
    try {
      const parent = node.parentNode;
      const text = node.nodeValue;
      const spanHTML = text.replace(courseRegexReplace, (match) => {
        return `<span class="rutgers-course" data-code="${match}">${match}</span>`;
      });

      const wrapper = document.createElement("span");
      wrapper.innerHTML = spanHTML;
      
      parent.replaceChild(wrapper, node);
    } catch (err) {
      console.warn("Could not wrap course code:", err);
    }
    
  });
}

async function fetchCourseInfo(courseCode) {
  const [school, subject, courseNum] = String(courseCode).split(":");
  
  // Cache key includes term/year in case you later support switching terms
  const cacheKey = `2026-1-NB-U:${courseCode}`;
  if (courseCache.has(cacheKey)) return courseCache.get(cacheKey);

  // Wrap chrome.runtime.sendMessage in a Promise
  const response = await new Promise((resolve) => {
    if (!chrome?.runtime?.sendMessage) return resolve(null);

    chrome.runtime.sendMessage(
      { type: "FETCH_SUBJECT", subject },
      (res) => {
        if (chrome.runtime.lastError) {
          console.error("sendMessage lastError:", chrome.runtime.lastError.message);
          return resolve(null);
        }
        resolve(res);
      }
    );
  });

  if (!response || !response.success || !Array.isArray(response.data) || response.data.length === 0) {
    console.error("No subject data found for:", subject, response);
    return null;
  }

  // 1) Narrow to exact subject + courseNumber
  const matches = response.data.filter((c) =>
    String(c.subject) === String(subject) &&
    String(c.courseNumber) === String(courseNum)
  );

  if (matches.length === 0) {
    console.error("Subject data returned but course not found:", courseCode);
    console.log("First 5 courses:", response.data.slice(0, 5));
    return null;
  }

  // 2) Prefer matching school/offeringUnitCode when present
  // Some payloads may omit offeringUnitCode — don't treat that as a match-all unless needed.
  const withSchool = matches.filter(
    (c) => c.offeringUnitCode != null && String(c.offeringUnitCode) === String(school)
  );

  // 3) Prefer the one whose courseString matches exactly, if present
  const pick =
    withSchool.find((c) => c.courseString && String(c.courseString) === courseCode) ||
    matches.find((c) => c.courseString && String(c.courseString) === courseCode) ||
    withSchool[0] ||
    matches[0];

  const result = {
    title: pick.expandedTitle || pick.title || "Unknown Title",
    credits: pick.credits || "N/A",
    // Keyword deep-link (works reliably)
    link: `https://classes.rutgers.edu/soc/#keyword?keyword=${encodeURIComponent(courseCode)}&year=2026&term=1&campus=NB&level=U`,
  };

  courseCache.set(cacheKey, result);
  return result;
  
}

/** 
async function fetchCourseInfo(courseCode) {
  return new Promise((resolve) => {

    if (!chrome?.runtime?.sendMessage) {
      console.error("Rutgers Hover: chrome.runtime.sendMessage is unavailable on this page/context.");
      return resolve(null);
    }

    chrome.runtime.sendMessage({ type: "FETCH_COURSE", code: courseCode }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("sendMessage lastError:", chrome.runtime.lastError.message);
        return resolve(null);
      }

      if (!response || !response.success || !Array.isArray(response.data) || response.data.length === 0) {
        console.error("No data found for:", courseCode, response);
        console.log("First returned object:", response.data[0]);
        console.log("Keys:", Object.keys(response.data[0] || {}));
        return resolve(null);
      }
      
      
      //const course = response.data[0];
      

      const [school, subject, courseNum] = courseCode.split(":");

      // Try multiple ways to match (some payloads differ)
      const course =
      // 1) Exact full string if present under common keys
      response.data.find(c => String(c.courseString || c.courseStringId || c.courseCode) === courseCode) ||

      // 2) Most reliable: subject + courseNumber (+ school if present)
      response.data.find(c =>
        String(c.subject) === String(subject) &&
        String(c.courseNumber) === String(courseNum) &&
        (
          c.offeringUnitCode == null || String(c.offeringUnitCode) === String(school)
        )
      ) ||

      // 3) Fallback: subject + courseNumber only
      response.data.find(c =>
        String(c.subject) === String(subject) &&
        String(c.courseNumber) === String(courseNum)
      );

      if (!course) {
        console.error("API returned data but no match for:", courseCode);
        console.log("Sample item keys:", Object.keys(response.data[0] || {}));
        console.log("First 5 items:", response.data.slice(0, 5));
        return resolve(null);
      }

      resolve({
        title: course.expandedTitle || course.title || "Unknown Title",
        credits: course.credits || "N/A",
        link: `https://classes.rutgers.edu/soc/#keyword?keyword=${encodeURIComponent(courseCode)}&year=2026&term=1&campus=NB&level=U`
      });
      
    });
  });
}
*/
// Position tooltip with edge detection
function positionTooltip(mouseX, mouseY) {
  const padding = 12;
  const rect = tooltip.getBoundingClientRect();
  
  let left = mouseX + padding;
  let top = mouseY + padding;
  
  // Check right edge
  if (left + rect.width > window.innerWidth + window.scrollX) {
    left = mouseX - rect.width - padding;
  }
  
  // Check bottom edge
  if (top + rect.height > window.innerHeight + window.scrollY) {
    top = mouseY - rect.height - padding;
  }
  
  tooltip.style.left = left + "px";
  tooltip.style.top = top + "px";
}

// Current hover state
let currentHoverEl = null;

// Hover tooltip logic
document.addEventListener("mouseover", async (e) => {
  const courseEl = e.target.closest(".rutgers-course");
  if (!courseEl) return;
  
  // Avoid re-fetching if hovering same element
  if (currentHoverEl === courseEl) return;
  currentHoverEl = courseEl;

  const code = courseEl.dataset.code;
  
  console.log("Hovered code:", code);
  
  tooltip.innerHTML = '<div style="color: #666;">Loading...</div>';
  tooltip.style.display = "block";
  positionTooltip(e.pageX, e.pageY);

  const [school, subject, courseNum] = code.split(":");
  //const full = 

  // Only School of Arts & Sciences
  if (school !== "01") {
    tooltip.innerHTML = '<div style="color: #999;">Course info only available for School of Arts & Sciences (01:xxx:xxx)</div>';
    return;
  }

  const courseData = await fetchCourseInfo(code);
  
  if (!courseData) {
    tooltip.innerHTML = '<div style="color: #c62828;">Course not found for Spring 2026</div>';
    return;
  }

  tooltip.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px; color: #000;">${courseData.title}</div>
    <div style="margin-bottom: 6px; color: #555;">Credits: ${courseData.credits || "N/A"}</div>
    <a href="${courseData.link}" 
       target="_blank"
       rel="noopener noreferrer"
       style="color: #cc0033; text-decoration: none; font-weight: 500;">
      Open in Schedule of Classes &rarr;
    </a>
  `;
  
  // Reposition after content loaded
  positionTooltip(e.pageX, e.pageY);
});

// Move tooltip with mouse
document.addEventListener("mousemove", (e) => {
  if (tooltip.style.display === "block") {
    positionTooltip(e.pageX, e.pageY);
  }
});

// Hide tooltip on mouseout
document.addEventListener("mouseout", (e) => {
  if (e.target.classList.contains("rutgers-course")) {
    tooltip.style.display = "none";
    currentHoverEl = null;
  }
});

// Initial scan on page load
wrapCourseCodes();

// Watch for dynamically added content
const observer = new MutationObserver((mutations) => {
  let shouldRescan = false;
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      shouldRescan = true;
      break;
    }
  }
  
  if (shouldRescan) {
    wrapCourseCodes();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});