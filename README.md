# Clover POS Bulk Price Changer for Categories
**by raccoon-exe (catari)**

I made this Chrome extension because I was tired of manually updating item prices one by one in the Clover Dashboard. If you have a category with 50 items, clicking through each one takes forever. This tool lets you update the price for every visible item in a category at once.

Check out more at: https://github.com/raccoon-exe

## How it works

It adds a simple overlay tool to your Clover Dashboard that automates the clicks:
1. It selects all items in your current list.
2. It hits the Edit button.
3. You type the new price once, and it updates every box on the screen.

## Installation

This isn't on the Chrome Web Store, so you need to load it manually. It's straightforward:

1. Download this code (Click the green **Code** button -> **Download ZIP**) and unzip it to a folder.
2. Open Chrome and type `chrome://extensions/` in the address bar.
3. Turn on **Developer mode** in the top right switch.
4. Click the **Load unpacked** button on the top left.
5. Select the folder you just unzipped.

You should see the extension in your list now, with my raccoon logo!

## How to use

1. Log into Clover and go to **Inventory** -> **Items**.
2. Click on the specific Category you want to change (e.g., "Soda" or "Shirts").
3. Click the extension icon in your browser toolbar and select **Show Bulk Editor Overlay**.
4. A window will appear at the bottom right. Just follow the buttons:
   - **Step 1**: Click "Enter Edit Mode". This tries to auto-select all items and click the Edit pencil.
   - **Step 2**: Click "Preview Fields". You'll see the price boxes turn red, confirming it works.
   - **Step 3**: Enter your new price and click "Apply to All".
5. Once the prices change, click the main **Save** button on the Clover page.

## Troubleshooting

- **If Step 1 fails**: Sometimes Clover loads slowly or the layout changes. If the auto-select doesn't work, just check the "Select All" box manually on the page and click the Edit pencil icon. Then proceed to Step 2.
- **Save button blocked**: You can drag the tool window by clicking and holding the green header if it's in the way.
- **Only visible items**: This updates what is currently on your screen. If you have multiple pages of items, you'll need to do this for each page.

## License

MIT License. Feel free to use or change it however you want.
