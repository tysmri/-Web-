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
let currentLocation = { lat: 35.68, lon: 139.76 };

async function getLocationByIP() {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();

  return {
    lat: data.latitude,
    lon: data.longitude
  };
}

function updateClock() {
  const now = new Date();

  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("time").textContent = `${h}:${m}:${s}`;
  document.getElementById("date").textContent = 
    `${now.getFullYear()} ${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
}

const interpolateColor = (a, b, t) =>
  a.map((v, i) => Math.round(v + t * (b[i] - v)));

function applyWeatherFilter(top, bottom, code) {
  const whiteMap = {2:0.1, 45:0.25, 48:0.25, 51:0.15, 53:0.2, 55:0.25, 71:0.25, 73:0.35, 75:0.5};
  const grayMap  = {3:0.25, 61:0.15, 63:0.3, 65:0.5, 80:0.2, 81:0.35, 82:0.5};
  const darkMap  = {95:0.5};

  const mix = (c, tgt, amt) => c.map(v => v * (1 - amt) + tgt * amt);

  if (whiteMap[code]) {
    top = mix(top, 255, whiteMap[code]);
    bottom = mix(bottom, 255, whiteMap[code]);
  }
  if (grayMap[code]) {
    top = mix(top, 140, grayMap[code]);
    bottom = mix(bottom, 140, grayMap[code]);
  }
  if (darkMap[code]) {
    const d = darkMap[code];
    top = top.map(v => v * (1 - d));
    bottom = bottom.map(v => v * (1 - d));
  }

  return [top, bottom];
}

function backgroundColor(code) {
  const now = new Date();
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const t = sec / 86400;

  const sun = -Math.cos(t * Math.PI * 2);
  const scale = (sun + 1) / 2;

  const nightTop = [20, 32, 48];
  const nightBottom = [40, 60, 80];
  const dayTop = [80, 176, 255];
  const dayBottom = [224, 240, 255];

  let top = interpolateColor(nightTop, dayTop, scale);
  let bottom = interpolateColor(nightBottom, dayBottom, scale);

  const red = 80 * (1 - Math.abs(scale - 0.5) * 2) ** 3;

  top[0] += red;
  bottom[0] += red;
  top[1] -= red * 0.25;
  bottom[1] -= red * 0.25;

  // フィルタ適用
  const filtered = applyWeatherFilter(top, bottom, code);
  top = filtered[0];
  bottom = filtered[1];

  const clamp = n => Math.min(Math.max(n, 0), 255);
  top = top.map(clamp);
  bottom = bottom.map(clamp);

  document.body.style.background =
    `linear-gradient(180deg, rgb(${top.join(",")}) 0%, rgb(${bottom.join(",")}) 100%)`;
}

async function loadWeather(lat = currentLocation.lat, lon = currentLocation.lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const temp = data.current_weather.temperature;
    const code = data.current_weather.weathercode;

    const map = {
      0:"快晴", 1:"晴れ", 2:"薄曇り", 3:"曇り",
      45:"霧", 48:"着氷霧",
      51:"弱い霧雨", 53:"霧雨", 55:"強い霧雨",
      61:"弱い雨", 63:"雨", 65:"強い雨",
      71:"弱い雪", 73:"雪", 75:"強い雪",
      80:"にわか雨", 81:"強いにわか雨", 82:"激しいにわか雨",
      95:"雷雨"
    };

    document.getElementById("temperature").textContent = `${temp}°C`;
    document.getElementById("weather-text").textContent = map[code] ?? `code:${code}`;

    currentWeatherCode = code;
  } catch (err) {
    document.getElementById("weather-text").textContent = "取得失敗";
  }
}

document.getElementById("locationSelect").addEventListener("change", async e => {
  const v = e.target.value;

  if (v === "here") {
    document.getElementById("weather-text").textContent = "現在地取得中...";
    try {
      const loc = await getLocationByIP();
      currentLocation = { lat: loc.lat, lon: loc.lon };
      await loadWeather(loc.lat, loc.lon);
      backgroundColor(currentWeatherCode);
    } catch {
      currentLocation = { lat: 35.68, lon: 139.76 };
      await loadWeather();
      backgroundColor(currentWeatherCode);
    }
  } else {
    const coords = locations[v];
    if (coords) {
      const [lat, lon] = coords;
      currentLocation = { lat, lon };
      await loadWeather(lat, lon);
      backgroundColor(currentWeatherCode);
    }
  }
});

// 初期化
updateClock();
setInterval(updateClock, 1000);

loadWeather().then(() => {
  backgroundColor(currentWeatherCode);
});

setInterval(loadWeather, 300000); // 5分ごと
setInterval(() => backgroundColor(currentWeatherCode), 60000); // 1分ごと（背景更新頻度を上げました）
