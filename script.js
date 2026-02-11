const locations = {
  sapporo: [43.06, 141.35],
  sendai:  [38.27, 140.87],
  tokyo:   [35.68, 139.76],
  nagoya:  [35.18, 136.91],
  osaka:   [34.69, 135.50],
  fukuoka: [33.59, 130.40],
  okinawa: [26.21, 127.68]
};

let currentWeatherCode = 0;
let currentLocation = { lat: 35.68, lon: 139.76 }; // 初期は東京固定
let usingGeolocation = false; // ←重要：現在地使用中か

// =============================
// 位置選択
// =============================
document.getElementById("locationSelect").addEventListener("change", async e => {
  const v = e.target.value;

  // -------------------------
  // 現在地
  // -------------------------
  if (v === "here") {
    usingGeolocation = true;
    document.getElementById("weather-text").textContent = "位置情報取得中...";

    try {
      const pos = await new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    resolve,
    reject,
    {
      enableHighAccuracy: false,
      timeout: 15000,     // ← ここで公式タイムアウト指定
      maximumAge: 60000
    }
  );
});

      currentLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };

      await loadWeather();

    } catch (error) {
      console.error("❌ 位置情報取得エラー:", error);

      usingGeolocation = false; // ←ここ重要

      document.getElementById("weather-text").textContent = "東京で表示";

      currentLocation = { lat: 35.68, lon: 139.76 };
      await loadWeather();
    }

  // -------------------------
  // 都市選択
  // -------------------------
  } else {
    usingGeolocation = false;

    const [lat, lon] = locations[v];
    currentLocation = { lat, lon };

    await loadWeather();
  }

  updateBackground();
});


// =============================
// 時計
// =============================
function updateClock() {
  const now = new Date();

  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("time").textContent = `${hours}:${mins}:${secs}`;
  document.getElementById("date").textContent =
    `${now.getFullYear()} ${String(now.getMonth()+1).padStart(2,"0")}/${String(now.getDate()).padStart(2,"0")}`;
}


// =============================
// 色補間
// =============================
const interpolateColor = (start, end, factor) =>
  start.map((s, i) => Math.round(s + factor * (end[i] - s)));


// =============================
// 天気フィルター
// =============================
function applyWeatherFilter(top, bottom, code) {

  const whiteMap = {
    2:0.1, 45:0.25, 48:0.25,
    51:0.15, 53:0.2, 55:0.25,
    71:0.25, 73:0.35, 75:0.5
  };

  const grayMap = {
    3:0.25,
    61:0.15, 63:0.3, 65:0.5,
    80:0.2, 81:0.35, 82:0.5
  };

  const darkMap = { 95:0.5 };

  const mixColor = (color, target, amount) =>
    color.map(c => c*(1-amount) + target*amount);

  if (whiteMap[code]) {
    top = mixColor(top, 255, whiteMap[code]);
    bottom = mixColor(bottom, 255, whiteMap[code]);
  }

  if (grayMap[code]) {
    top = mixColor(top, 140, grayMap[code]);
    bottom = mixColor(bottom, 140, grayMap[code]);
  }

  if (darkMap[code]) {
    const d = darkMap[code];
    top = top.map(c => c*(1-d));
    bottom = bottom.map(c => c*(1-d));
  }

  return [top, bottom];
}


// =============================
// 背景
// =============================
function backgroundColor(weatherCode) {
  const now = new Date();

  const totalSeconds =
    now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();

  const dayProgress = totalSeconds / 86400;

  const sunHeight = -Math.cos(dayProgress * Math.PI * 2);
  const scale = (sunHeight + 1) / 2;

  const nightTop = [20, 32, 48];
  const nightBottom = [40, 60, 80];
  const dayTop = [80, 176, 255];
  const dayBottom = [224, 240, 255];

  let redBoostFactor = (1 - Math.abs(scale - 0.5) * 2) ** 3;
  const redBoostAmount = 80 * redBoostFactor;

  let currentTop = interpolateColor(nightTop, dayTop, scale);
  let currentBottom = interpolateColor(nightBottom, dayBottom, scale);

  currentTop[0] += redBoostAmount;
  currentBottom[0] += redBoostAmount;
  currentTop[1] -= redBoostAmount * 0.25;
  currentBottom[1] -= redBoostAmount * 0.25;

  [currentTop, currentBottom] =
    applyWeatherFilter(currentTop, currentBottom, weatherCode);

  const clamp = n => Math.min(Math.max(n, 0), 255);
  currentTop = currentTop.map(clamp);
  currentBottom = currentBottom.map(clamp);

  document.body.style.background =
    `linear-gradient(180deg, rgb(${currentTop.join(",")}) 0%, rgb(${currentBottom.join(",")}) 100%)`;
}

function updateBackground() {
  backgroundColor(currentWeatherCode);
}


// =============================
// 天気取得
// =============================
async function loadWeather() {

  const { lat, lon } = currentLocation;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const temp = data.current_weather.temperature;
    const code = data.current_weather.weathercode;

    const weatherMap = {
      0:"快晴",1:"晴れ",2:"薄曇り",3:"曇り",
      45:"霧",48:"着氷霧",
      51:"弱い霧雨",53:"霧雨",55:"強い霧雨",
      61:"弱い雨",63:"雨",65:"強い雨",
      71:"弱い雪",73:"雪",75:"強い雪",
      80:"にわか雨",81:"強いにわか雨",82:"激しいにわか雨",
      95:"雷雨"
    };

    document.getElementById("temperature").textContent = `${temp}°C`;
    document.getElementById("weather-text").textContent =
      weatherMap[code] ?? `code:${code}`;

    currentWeatherCode = code;

    updateBackground();

  } catch (e) {
    console.error("天気取得エラー:", e);
    document.getElementById("weather-text").textContent = "取得失敗";
  }
}


// =============================
// 初期化
// =============================
updateClock();
setInterval(updateClock, 1000);

// ★ 初期は東京のみ（現在地は触らない）
loadWeather();

// ★ 天気5分更新（現在地再取得はしない）
setInterval(loadWeather, 300000);

// ★ 背景10分更新
setInterval(updateBackground, 600000);


