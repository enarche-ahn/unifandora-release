// Override console.log to forward log messages to the main process.
(function() {
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (window.electronAPI && typeof window.electronAPI.sendLog === 'function') {
      window.electronAPI.sendLog(args.join(' '));
    }
    originalConsoleLog.apply(console, args);
  };
})();

/* Global option variables and slideshow state */
let slideShowTime = 5;
let includeSubfolders = true;
let shuffle = true;
let checkUpdate = true;
let playVideoTillEndOption = false;
let windowOpacity = 100;
let slideshowTimeoutId = null;
let currentSlideshowActive = false;
let lastFolderPath = null;
let showClock = true;
let transitionDuration = 1000;
let slideshowFiles = [];
let slideshowIndex = 0;
let isPaused = false;
let currentMediaNaturalWidth = 0;
let currentMediaNaturalHeight = 0;
let prevWindowWidth = window.innerWidth;
let prevWindowHeight = window.innerHeight;
let isResizingProgrammatically = false;
let currentMediaElement = null;
let currentMediaType = '';
let previousMediaElement = null;

/**
 * Returns the current configuration for saving on exit.
 */
window.getCurrentConfig = function() {
  return {
    lastFolderPath,
    includeSubfolders,
    shuffle,
    showClock,
    checkUpdate,
    slideShowTime,
    playVideoTillEndOption,
    opacity: windowOpacity
  };
};

/**
 * Displays about information on the main display.
 */
function showAboutInfo() {
  const display = document.getElementById('display');
  display.innerHTML = `
    <img src="assets/icons/app-icon.png" alt="App Icon" class="app-icon" draggable="false" />
    <div class="help">
      <strong>&lt;Mouse Right Click&gt;</strong><br>
      <span class="help-desc">Show context menu</span><br><br>
      <strong>&lt;Open Folder&gt;</strong><br>
      <span class="help-desc">Select your image folder</span>
    </div>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  showAboutInfo();
  const style = document.createElement('style');
  style.textContent = `
    .media-element {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: opacity ${transitionDuration}ms ease;
    }
    .prev-media { opacity: 1; }
    .current-media { opacity: 0; }
    .fade-in { opacity: 1; }
    .fade-out { opacity: 0; }
  `;
  document.head.appendChild(style);
  console.log('Slideshow started...');
});

window.addEventListener('resize', () => {
  updatePlayOverlay();
  const message = document.getElementById('pause-message');
  if (message) {
    updateMessageSize(message);
  }
});

// Event handler for "Open Folder" button.
document.getElementById('open-folder-btn').addEventListener('click', async () => {
  const result = await window.electronAPI.selectFolder({ includeSubfolders });
  if (result && result.files && result.files.length > 0) {
    if (currentSlideshowActive) {
      clearTimeout(slideshowTimeoutId);
      slideshowTimeoutId = null;
      document.getElementById('display').innerHTML = '';
      currentSlideshowActive = false;
      currentMediaElement = null;
      previousMediaElement = null;
    }
    lastFolderPath = result.folderPath;
    const config = {
      lastFolderPath,
      includeSubfolders,
      shuffle,
      showClock,
      checkUpdate,
      slideShowTime,
      playVideoTillEndOption
    };
    window.electronAPI.saveConfig(config);
    startSlideshow(result.files);
  }
});

// Event handler for "Options" button.
document.getElementById('options-btn').addEventListener('click', () => {
  window.electronAPI.openOptions();
});

// Listener for updated options.
window.electronAPI.onOptionsUpdated((event, newOptions) => {
  includeSubfolders = newOptions.includeSubfolders;
  shuffle = newOptions.shuffle;
  showClock = newOptions.showClock;
  checkUpdate = newOptions.checkUpdate;
  slideShowTime = newOptions.slideShowTime;
  playVideoTillEndOption = newOptions.playVideoTillEndOption;
  windowOpacity = newOptions.opacity;
});

// Listener for context menu commands.
window.electronAPI.onContextMenuCommand((event, command) => {
  if (command === 'open-folder') {
    document.getElementById('open-folder-btn').click();
  } else if (command === 'options') {
    document.getElementById('options-btn').click();
  } else if (command === 'toggle-playback') {
    togglePlayback();
  }
});

// Listener for auto-start folder command.
window.electronAPI.onAutoStartFolder(async (event, config) => {
  includeSubfolders = config.includeSubfolders;
  shuffle = config.shuffle;
  showClock = config.showClock;
  checkUpdate = config.checkUpdate;
  slideShowTime = config.slideShowTime;
  playVideoTillEndOption = config.playVideoTillEndOption;
  lastFolderPath = config.lastFolderPath;
  const files = await window.electronAPI.loadFolderFromPath(config.lastFolderPath, { includeSubfolders });
  if (files && files.length > 0) {
    startSlideshow(files);
  } else {
    showAboutInfo();
  }
});

/**
 * Implements custom window dragging functionality.
 */
const display = document.getElementById('display');
let isDragging = false, dragStartX = 0, dragStartY = 0, windowStartX = 0, windowStartY = 0;
display.addEventListener('mousedown', async (e) => {
  if (e.button !== 0) return;
  isDragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  const pos = await window.electronAPI.getWindowPosition();
  windowStartX = pos[0];
  windowStartY = pos[1];
});
display.addEventListener('contextmenu', (e) => { isDragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const offsetX = e.screenX - dragStartX;
  const offsetY = e.screenY - dragStartY;
  const newX = windowStartX + offsetX;
  const newY = windowStartY + offsetY;
  window.electronAPI.moveWindow(newX, newY);
});
window.addEventListener('mouseup', () => { isDragging = false; });

/**
 * Displays a play overlay icon and pause message.
 */
function showPlayOverlay() {
  let overlay = document.createElement('div');
  overlay.id = 'play-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.opacity = '0.5';
  overlay.style.cursor = 'pointer';
  updatePlayOverlaySize(overlay);
  overlay.style.backgroundColor = 'black';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';
  overlay.style.color = '#fff';
  overlay.innerHTML = '▶';
  overlay.addEventListener('click', () => { togglePlayback(); });
  if (getComputedStyle(display).position === 'static') {
    display.style.position = 'relative';
  }
  display.appendChild(overlay);
  showPauseMessage();
}

/**
 * Updates the size of the play overlay based on the window dimensions.
 */
function updatePlayOverlaySize(overlay) {
  let size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  overlay.style.width = size + 'px';
  overlay.style.height = size + 'px';
  overlay.style.borderRadius = '50%';
  overlay.style.fontSize = (size * 0.5) + 'px';
  overlay.style.lineHeight = size + 'px';
}

/**
 * Updates the font size of a message element.
 */
function updateMessageSize(message) {
  let size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  message.style.fontSize = (size * 0.15) + 'px';
}

/**
 * Updates the play overlay if it exists.
 */
function updatePlayOverlay() {
  const overlay = document.getElementById('play-overlay');
  if (overlay) { updatePlayOverlaySize(overlay); }
}

/**
 * Hides and removes the play overlay and pause message.
 */
function hidePlayOverlay() {
  const overlay = document.getElementById('play-overlay');
  if (overlay) { overlay.remove(); }
  hidePauseMessage();
}

/**
 * Shows a "Paused" message on the display.
 */
function showPauseMessage() {
  let message = document.createElement('div');
  message.id = 'pause-message';
  message.style.position = 'absolute';
  message.style.top = '10%';
  message.style.left = '50%';
  message.style.transform = 'translateX(-50%)';
  message.style.color = '#fff';
  updateMessageSize(message);
  message.style.textShadow = '2px 2px 4px rgba(0,0,0,0.7)';
  message.style.zIndex = '1001';
  message.innerHTML = 'Paused';
  if (getComputedStyle(display).position === 'static') {
    display.style.position = 'relative';
  }
  display.appendChild(message);
}

/**
 * Hides the pause message if present.
 */
function hidePauseMessage() {
  const message = document.getElementById('pause-message');
  if (message) { message.remove(); }
}

/**
 * Adjusts the window size based on media's natural dimensions.
 */
function adjustWindowSize(naturalWidth, naturalHeight) {
  currentMediaNaturalWidth = naturalWidth;
  currentMediaNaturalHeight = naturalHeight;
  let fixedWidth = window.innerWidth;
  if (naturalWidth < fixedWidth) { fixedWidth = naturalWidth; }
  let newWidth = fixedWidth;
  let newHeight = Math.round(newWidth * naturalHeight / naturalWidth);
  const screenHeight = window.screen.height;
  if (newHeight > screenHeight) {
    newHeight = screenHeight;
    newWidth = Math.round(newHeight * naturalWidth / naturalHeight);
  }
  safeResizeWindow(newWidth, newHeight);
  prevWindowWidth = newWidth;
  prevWindowHeight = newHeight;
}

/**
 * Safely resizes the window accounting for platform-specific adjustments.
 */
function safeResizeWindow(contentWidth, contentHeight) {
  let adjustedWidth = contentWidth;
  let adjustedHeight = contentHeight;
  if (navigator.userAgent.indexOf("Windows") > -1) {
    const frameWidth = window.outerWidth - window.innerWidth;
    const frameHeight = window.outerHeight - window.innerHeight;
    adjustedWidth = contentWidth + frameWidth;
    adjustedHeight = contentHeight + frameHeight;
  }
  return window.electronAPI.resizeWindow(adjustedWidth, adjustedHeight);
}

/**
 * Debounces window resize events to adjust media aspect ratio.
 */
let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
  if (!currentSlideshowActive || !currentMediaNaturalWidth || !currentMediaNaturalHeight || isResizingProgrammatically) return;
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const deltaW = Math.abs(newWidth - prevWindowWidth);
    const deltaH = Math.abs(newHeight - prevWindowHeight);
    if (deltaW < 2 && deltaH < 2) return;
    isResizingProgrammatically = true;
    if (deltaW >= deltaH) {
      const adjustedHeight = Math.round(newWidth * currentMediaNaturalHeight / currentMediaNaturalWidth);
      safeResizeWindow(newWidth, adjustedHeight).then(() => {
        prevWindowWidth = newWidth;
        prevWindowHeight = adjustedHeight;
        isResizingProgrammatically = false;
      });
    } else {
      const adjustedWidth = Math.round(newHeight * currentMediaNaturalWidth / currentMediaNaturalHeight);
      safeResizeWindow(adjustedWidth, newHeight).then(() => {
        prevWindowWidth = adjustedWidth;
        prevWindowHeight = newHeight;
        isResizingProgrammatically = false;
      });
    }
  }, 300);
});

/**
 * Updates the time display.
 */
let flicker = true;
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  let timeString = '';
  if (showClock) {
    timeString = flicker ? `${hours}:${minutes}` : `${hours}  ${minutes}`;
    flicker = !flicker;
  }
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) { timeDisplay.textContent = timeString; }
}
setInterval(updateTime, 1000);
updateTime();

/**
 * Starts the slideshow with the given file list.
 */
function startSlideshow(files) {
  if (shuffle) {
    for (let i = files.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [files[i], files[j]] = [files[j], files[i]];
    }
  }
  slideshowFiles = files;
  slideshowIndex = 0;
  isPaused = false;
  currentSlideshowActive = true;
  currentMediaElement = null;
  previousMediaElement = null;
  window.electronAPI.setSlideshowState(true);
  const display = document.getElementById('display');
  display.style.position = 'relative';
  display.innerHTML = '';
  showNext();
}

/**
 * Displays the next media element in the slideshow.
 */
function showNext() {
  if (slideshowFiles.length === 0) {
    showAboutInfo();
    currentSlideshowActive = false;
    return;
  }
  const display = document.getElementById('display');
  const file = slideshowFiles[slideshowIndex];
  const ext = file.split('.').pop().toLowerCase();

  if (currentMediaElement) {
    if (previousMediaElement && display.contains(previousMediaElement)) {
      display.removeChild(previousMediaElement);
    } else {
      previousMediaElement = null;
    }
    previousMediaElement = currentMediaElement;
    previousMediaElement.classList.remove('current-media');
    previousMediaElement.classList.add('prev-media');
    setTimeout(() => {
      if (previousMediaElement) {
        previousMediaElement.classList.add('fade-out');
      }
    }, 50);
  }
  
  let element;
  if (['mp4', 'webm', 'ogg'].includes(ext)) {
    currentMediaType = 'video';
    element = document.createElement('video');
    element.src = file;
    element.muted = true;
    element.controls = false;
    element.autoplay = true;
    element.classList.add('media-element', 'current-media');
    element.onerror = () => {
      clearTimeout(slideshowTimeoutId);
      slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
      if (!isPaused) showNext();
    };
    element.onloadedmetadata = () => {
      adjustWindowSize(element.videoWidth, element.videoHeight);
      setTimeout(() => { element.classList.add('fade-in'); }, 50);
    };
    display.appendChild(element);
    currentMediaElement = element;
    if (playVideoTillEndOption) {
      element.addEventListener('ended', () => {
        slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
        if (!isPaused) showNext();
      });
    } else {
      slideshowTimeoutId = setTimeout(() => {
        slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
        if (!isPaused) showNext();
      }, slideShowTime * 1000);
    }
  } else {
    element = document.createElement('img');
    element.draggable = false;
    element.classList.add('media-element', 'current-media');
    element.onerror = () => {
      clearTimeout(slideshowTimeoutId);
      slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
      if (!isPaused) showNext();
    };
    element.onload = () => {
      adjustWindowSize(element.naturalWidth, element.naturalHeight);
      setTimeout(() => { element.classList.add('fade-in'); }, 50);
    };
    element.src = file;
    display.appendChild(element);
    currentMediaElement = element;
    currentMediaType = (ext === 'gif') ? 'gif' : 'image';
    slideshowTimeoutId = setTimeout(() => {
      slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
      if (!isPaused) showNext();
    }, slideShowTime * 1000);
  }
  
  setTimeout(() => {
    if (previousMediaElement && previousMediaElement.parentNode === display) {
      display.removeChild(previousMediaElement);
      previousMediaElement = null;
    }
  }, transitionDuration + 100);
}

/**
 * Toggles playback (pause/resume) of the slideshow.
 */
function togglePlayback() {
  if (!currentSlideshowActive) return;
  if (!isPaused) {
    isPaused = true;
    if (slideshowTimeoutId) {
      clearTimeout(slideshowTimeoutId);
      slideshowTimeoutId = null;
    }
    if (currentMediaType === 'video' && currentMediaElement) {
      currentMediaElement.pause();
    }
    showPlayOverlay();
  } else {
    isPaused = false;
    hidePlayOverlay();
    if (currentMediaType === 'video' && currentMediaElement) {
      currentMediaElement.play();
      if (!playVideoTillEndOption) {
        slideshowTimeoutId = setTimeout(() => {
          slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
          if (!isPaused) showNext();
        }, slideShowTime * 1000);
      }
    } else {
      slideshowTimeoutId = setTimeout(() => {
        slideshowIndex = (slideshowIndex + 1) % slideshowFiles.length;
        if (!isPaused) showNext();
      }, slideShowTime * 1000);
    }
  }
  window.electronAPI.setSlideshowState(!isPaused);
}
