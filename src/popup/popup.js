document.getElementById('showTool').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url.includes('clover.com')) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_ui" }, (response) => {
      if (chrome.runtime.lastError) {
        document.getElementById('status').innerText = "Error: Refresh the page!";
        // Attempt to inject if not already injected (fallback)
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } else {
        document.getElementById('status').innerText = "Editor Shown!";
        setTimeout(() => window.close(), 100); // Close popup to get out of the way
      }
    });
  } else {
    document.getElementById('status').innerText = "Please go to Clover Dashboard.";
  }
});
