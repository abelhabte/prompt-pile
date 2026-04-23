from weasyprint import HTML

# Content for the README.md
readme_content = """# <img src="icons/logo_web_512.png" alt="logo" width="45" height="45" style="vertical-align: middle; margin-right: 10px;"> Prompt Pile

**Prompt Pile** is a streamlined sidebar web extension designed to save and organize AI prompts. Regardless of the model you are currently using, this tool helps maintain a personal library of high-performing prompts to optimize your AI interactions.

---

### Gallery
| Main Interface | Folder Management |
| :---: | :---: |
| <img src="screenshots/screenshot_1.png" width="280" alt="Main Interface"> | <img src="screenshots/screenshot_3.png" width="280" alt="Folder Management"> |
| **Prompt Editor** | **Dark Mode** |
| <img src="screenshots/screenshot_2.png" width="280" alt="Prompt Editor"> | <img src="screenshots/screenshot_4.png" width="280" alt="Dark Mode"> |

---

## Key Features

* **Nested & Fluid Organization:** Group prompts into custom folders. Drag-and-drop handles allow you to reorder both your folders and the prompts inside.
* **Model Categorization:** Tag prompts for specific models like ChatGPT, Claude, Gemini, DeepSeek, and more with integrated icons.
* **Prompt Mobility:** Easily move prompts between folders or edit them on the fly using the built-in move menu.
* **Advanced Clipboard Tool:** Copy prompts with a single click; includes visual feedback and preserves multi-line formatting.
* **Search & Filter:** Instantly find prompts within your library using the real-time search bar.
* **Persistent Dark Mode:** Toggle between light and dark themes, with preferences saved automatically to local storage.
* **JSON Backups:** Export your entire library to a JSON file or import a previous backup for easy migration.

---

## Getting Started

### Installation

#### Extension Store
Install Prompt Pile directly from your browser's official marketplace:
* [**Chrome Web Store**](https://chrome.google.com/webstore)
* [**Firefox Add-ons**](https://addons.mozilla.org)

#### Local Install (Development)
1.  **Clone the Repository:** `git clone https://github.com/abelhabte/prompt-pile.git`
2.  **Open Extension Management:**
    * **Chrome:** Navigate to `chrome://extensions/` and enable **Developer mode**.
    * **Firefox:** Navigate to `about:debugging#/runtime/this-firefox`.
3.  **Load the Extension:**
    * **Chrome:** Click **Load unpacked** and select the project folder.
    * **Firefox:** Click **Load Temporary Add-on** and select the `manifest.json` file.

### Basic Usage
* **Create a Folder:** Click the `+ Folder` button to start a new category.
* **Manage Prompts:** Use the three-dot menu (⋮) on any folder to add a prompt, rename, or delete the folder.
* **Quick Copy:** Click the **Copy** button on a saved prompt to instantly add the text to your clipboard.
* **Import Library:** Click **Import** to restore a previous library from a compatible JSON file.

---

## Technical Stack
* **HTML5 & CSS3** (Material-inspired OLED Design)
* **JavaScript (ES6+)**
* **Manifest V3**
* **Local Storage API** (For persistence)

---

## References
* `popup.js`
"""

# Save to a .md file
with open("README-v1.md", "w") as f:
    f.write(readme_content)