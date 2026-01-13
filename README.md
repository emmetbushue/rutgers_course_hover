# Rutgers Course Hover

Rutgers Course Hover is a Chrome extension that automatically detects Rutgers course codes (e.g. `01:198:211`) on any webpage and displays course information on hover, with a direct link to the official Rutgers Schedule of Classes.

---

## Features

- **Automatic course detection**  
  Identifies Rutgers course codes in the format `school:department:course` anywhere on a webpage.

- **Hover for details**  
  Hover over a detected course code to view:
  - Course title  
  - Credit amount  

- **One-click Schedule of Classes link**  
  Click the tooltip to open the Rutgers Schedule of Classes with the course pre-filled.

- **New Brunswick undergraduate focus**  
  Results are restricted to:
  - Campus: New Brunswick  
  - Level: Undergraduate  

- **Fast and lightweight**  
  Uses in-memory caching to reduce repeated API requests.

---

## Example

Hovering over `01:198:211` displays:

Computer Architecture
Credits: 4
Open in Schedule of Classes →


---

## How It Works

1. A content script scans visible text on the page for Rutgers course codes.
2. Detected course codes are wrapped in hoverable elements.
3. On hover:
   - The extension queries Rutgers’ public Schedule of Classes API.
   - Results are filtered to match the exact department and course number.
4. A tooltip displays the course information and provides a clickable link.

---

## Installation (Local Development)

1. Clone the repository:


2. Open Chrome and navigate to:
chrome://extensions
3. Enable **Developer mode** (top right).

4. Click **Load unpacked** and select the project directory.

5. Visit any webpage containing Rutgers course codes and hover to see details.

---

## File Structure
├── manifest.json # Extension configuration
├── content.js # DOM scanning and tooltip logic
├── background.js # API requests (CORS-safe)
├── styles.css # Tooltip styling
└── icons/ # Extension icons


---

## Privacy

This extension does not collect, store, or transmit personal data.  
All processing occurs locally in the user’s browser, and only publicly available Rutgers course information is accessed.

---

## Motivation

Rutgers course codes frequently appear in planning tools, Degree Navigator, discussion boards, and documentation, but they lack immediate context. Rutgers Course Hover removes friction by making course details instantly accessible wherever the code appears.

---

## Future Improvements

- Automatic semester detection
- Graduate course support
- Section-level details (instructors, meeting times)
- Firefox compatibility

---
