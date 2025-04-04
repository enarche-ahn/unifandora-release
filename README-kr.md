# UniFandora

<i style="color: orange;">
  당신의 덕질을 응원합니다!
</i><br>
당신의 팬덤 여정이 시작되는 곳<br>
이 슬라이드쇼 프로그램은 당신이 사랑하는 스타들에 대한 애정을 표현하고 즐기기 위해 디자인되었습니다.<br>
UniFnadora는 당신의 덕질이 시작되는 곳이 되고 싶습니다.<br>

<br>
<table>
  <tr>
    <td><img src="assets/help/running.gif" alt="Running" width="266" /></td>
    <td>
      <a href="https://youtu.be/Bk4apkK9hVU?si=SxhOfx8X3i6jFjcd">
        <img src="assets/help/example.gif" alt="Example" width="320" />
      </a>
    </td>
  </tr>
</table>

## 지원 OS
UniFandora는 Electron 으로 만들어져 Cross Platform을 지원합니다
- Windows : 동작 확인함, 배포 버전 제공(
  <a href="https://github.com/enarche-ahn/unifandora-release/releases">Download</a>
)
- macOS : 동작 확인함, 배포 버전 제공안함 (직접 빌드, 향후 제공 예정)
- Linux : 동작 확인 안함


## 사용법
### 시작
<img src="assets/help/screenshot - first.jpg" alt="help1" width="200" /><br>
프로그램 처음 시작시, 슬라이드쇼 시작 폴더 지정 필요<br>
이후에는 마지막 폴더로 자동 시작함<br>

### 팝업 메뉴
<img src="assets/help/screenshot - popup menu.jpg" alt="help2" width="200" /><br>
마우스 오른쪽 클릭시, 팝업 메뉴 표시됨<br>
- [Open Folder] : 슬라이드쇼 시작 폴더 지정
- [Options] : 옵션창 표시
- [Exit] : 프로그램 종료

### 옵션
<img src="assets/help/screenshot - options.jpg" alt="help1" width="300" /><br>
팝업 메뉴에서 [Options] 선택시 표시<br>
- [Transparency] : 창의 투명도 조절
- [Always on Top] : 창을 항상 위에 표시
- [Show Clock] : 시계 표시
- [Include Subfolders] : 선택한 슬라이드쇼 시작 폴더내 하위 폴더 포함
- [Shuffle Playlist] : 슬라이드쇼 무작위 순서 사용
- [Slideshow Time] : 각 파일마다의 슬라이드쇼 재생 시간
- [Full Video Playback] : 동영상 파일의 경우 설정 슬라이드쇼 재생 시간 상관없이 끝까지 재생

## 빌드

### 개발
```
$ npm install
$ npm start
```

### 패키지
```
$ npm install electron-builder --save-dev
$ npm run dist
```

### 배포
```
$ npm install electron-updater --save
$ npm run deploy
```

## 후원

<table>
  <tr>
    <td align="center" colspan="3">
      <strong><i style="color: orange;">앱이 마음에 들었나요? 커피 한잔 사주세욤!</i></strong>
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
      <i style="color: orange;">당신의 후원에 감사합니다!</i>
    </td>
  </tr>
</table>
