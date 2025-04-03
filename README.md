# UniFandora

<a href="README-kr.md">[한국어 Readme]</a>

<i style="color: orange;">
  I support your fandom!
</i><br>
Where your fandom journey begins<br>
This slideshow program is designed for you to express and enjoy your affection for the stars you love.<br>
UniFnadora wants to be the place where your love for stars begins.<br>

<br>
<table>
  <tr>
    <td><img src="assets/help/running.gif" alt="Running" width="266" /></td>
    <td><img src="assets/help/example.gif" alt="Example" width="320" /></td>
  </tr>
</table>

## Supported OS
UniFandora is built with Electron and supports Cross Platform

- Windows: Operation confirmed, distribution version provided(
<a href="https://github.com/enarche-ahn/unifandora-release/releases">Download</a>
)
- macOS: Operation confirmed, distribution version not provided (build directly, planned to be provided in the future)
- Linux: Operation not confirmed

## Usage
### Start
<img src="assets/help/screenshot - first.jpg" alt="help1" width="200" /><br>
When starting the program for the first time, you need to select the slideshow start folder<br>
Afterwards, it automatically starts with the last folder<br>

### Popup Menu
<img src="assets/help/screenshot - popup menu.jpg" alt="help2" width="200" /><br>
Right-click to display the popup menu<br>
- [Open Folder] : Select the slideshow start folder
- [Options] : Display options window
- [Exit] : Exit the program

### Options
<img src="assets/help/screenshot - options.jpg" alt="help1" width="300" /><br>
Displayed when selecting [Options] from the popup menu<br>
- [Transparency] : Adjust window transparency
- [Always on Top] : Always display window on top
- [Show Clock] : Display clock
- [Include Subfolders] : Include subfolders within the selected slideshow start folder
- [Shuffle Playlist] : Use random order for slideshow
- [Slideshow Time] : Playback time for each file in the slideshow
- [Full Video Playback] : For video files, play until the end regardless of the slideshow time setting

## Build

### dev
```
$ npm install
$ npm start
```

### package
```
$ npm install electron-builder --save-dev
$ npm run dist
```

### release
```
$ npm install electron-updater --save
$ npm run deploy
```



## Sponsorship

<table>
  <tr>
    <td align="center" colspan="3">
      <strong><i style="color: orange;">Like this app? Buy me a coffee!</i></strong>
    </td>
  </tr>
  <tr>
    <td align="center" width="250">
      <a href="https://qr.kakaopay.com/Ej8e5k8865dc01820">
        <img src="assets/kakaopay.png" alt="Kakaopay" width="150" />
      </a>
    </td>
    <td align="center" width="250">
      <a href="https://www.paypal.me/EnarcheAhn">
        <img src="assets/paypal.png" alt="PayPal" width="180" />
      </a>
    </td>
    <td align="center" width="250">
      <img src="assets/BuyMeCoffee.png" alt="Buy Me A Coffee" width="150" />
      <br>
      <a href="https://www.buymeacoffee.com/enarche" target="_blank">
        <img src="assets/BuyMeCoffeeButton.png" alt="Buy Me A Coffee" style="height: 24px !important;width: 87px !important;" >
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="3">
      <i style="color: orange;">Thank you for your sponsorship!</i>
    </td>
  </tr>
</table>
