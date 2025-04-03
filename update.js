document.addEventListener('DOMContentLoaded', () => {
  // Display the current version from URL hash if provided
  let version = window.location.hash.substring(1);
  document.getElementById('version').innerText = version || "Unknown";

  // Listen for update messages from the main process using electronAPI.onMessage
  if (window.electronAPI && window.electronAPI.onMessage) {
    window.electronAPI.onMessage((text) => {
      const container = document.getElementById('messages');
      const message = document.createElement('div');
      message.innerText = text;
      container.appendChild(message);
    });
  }
});
