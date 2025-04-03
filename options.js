window.addEventListener('DOMContentLoaded', async () => {
  const config = await window.electronAPI.getConfig();
  const pathEdit = document.getElementById("path-edit");
  const includeCheckbox = document.getElementById('include-subfolders-checkbox');
  const shuffleCheckbox = document.getElementById('shuffle-checkbox');
  const showClockCheckbox = document.getElementById('clock-checkbox');
  const updateCheckbox = document.getElementById('update-checkbox');
  const timeSlider = document.getElementById('slideshow-time-slider');
  const timeValue = document.getElementById('slideshow-time-value');
  const playVideoCheckbox = document.getElementById('play-video-till-end-checkbox');
  const alwaysOnTopCheckbox = document.getElementById('always-on-top-checkbox');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityValue = document.getElementById('opacity-value');

  pathEdit.value = config.lastFolderPath || '';
  includeCheckbox.checked = config.includeSubfolders !== undefined ? config.includeSubfolders : true;
  shuffleCheckbox.checked = config.shuffle !== undefined ? config.shuffle : true;
  showClockCheckbox.checked = config.showClock !== undefined ? config.showClock : true;
  updateCheckbox.checked = config.checkUpdate !== undefined ? config.checkUpdate : true;
  timeSlider.value = config.slideShowTime || 5;
  timeValue.textContent = config.slideShowTime || 5;
  playVideoCheckbox.checked = config.playVideoTillEndOption !== undefined ? config.playVideoTillEndOption : false;
  alwaysOnTopCheckbox.checked = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
  opacitySlider.value = config.opacity !== undefined ? config.opacity : 100;
  opacityValue.textContent = config.opacity !== undefined ? config.opacity : 100;

  timeSlider.addEventListener('input', (e) => {
    timeValue.textContent = e.target.value;
  });
  opacitySlider.addEventListener('input', (e) => {
    opacityValue.textContent = e.target.value;
  });

  document.getElementById('apply-options-btn').addEventListener('click', () => {
    const newOptions = {
      includeSubfolders: includeCheckbox.checked,
      shuffle: shuffleCheckbox.checked,
      showClock: showClockCheckbox.checked,
      checkUpdate: updateCheckbox.checked,
      slideShowTime: parseInt(timeSlider.value, 10),
      playVideoTillEndOption: playVideoCheckbox.checked,
      alwaysOnTop: alwaysOnTopCheckbox.checked,
      opacity: parseInt(opacitySlider.value, 10)
    };
    window.electronAPI.updateOptions(newOptions);
    window.close();
  });

  document.getElementById('cancel-options-btn').addEventListener('click', () => {
    window.close();
  });
});
