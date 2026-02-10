// 色補間
const interpolateColor = (start, end, factor) =>
    start.map((s, i) => Math.round(s + factor * (end[i] - s)));

function updateClock() {
    const now = new Date();

    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("time").textContent = `${hours}:${mins}:${secs}`;
    document.getElementById("date").textContent =
        `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;

    // ===== ここから元の美しい色ロジック =====

    const totalSeconds = (hours * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const dayProgress = totalSeconds / 86400;

    const sunHeight = -Math.cos(dayProgress * Math.PI * 2);
    const scale = (sunHeight + 1) / 2;

    const nightTop = [20, 30, 48];
    const nightBottom = [40, 62, 81];
    const dayTop = [79, 172, 255];
    const dayBottom = [224, 247, 255];

    let redBoostFactor = 1 - Math.abs(scale - 0.5) * 2;
    redBoostFactor = Math.pow(redBoostFactor, 3);
    const redBoostAmount = 80 * redBoostFactor;

    let currentTop = interpolateColor(nightTop, dayTop, scale);
    let currentBottom = interpolateColor(nightBottom, dayBottom, scale);

    currentTop[0] += redBoostAmount;
    currentBottom[0] += redBoostAmount;
    currentTop[1] -= redBoostAmount * 0.3;
    currentBottom[1] -= redBoostAmount * 0.3;

    const clamp = n => Math.min(Math.max(n, 0), 255);
    currentTop = currentTop.map(clamp);
    currentBottom = currentBottom.map(clamp);

    document.body.style.background =
        `linear-gradient(180deg, rgb(${currentTop.join(",")}) 0%, rgb(${currentBottom.join(",")}) 100%)`;

    document.documentElement.style.setProperty('--wave-color-r', currentBottom[0]);
    document.documentElement.style.setProperty('--wave-color-g', currentBottom[1]);
    document.documentElement.style.setProperty('--wave-color-b', currentBottom[2]);
    document.documentElement.style.setProperty('--text-wave-color', `rgba(${currentBottom[0]},${currentBottom[1]},${currentBottom[2]},0.6)`);
}

// 天気取得（東京固定：提出用に安定）
async function loadWeather() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.76&current_weather=true";

    const res = await fetch(url);
    const data = await res.json();

    const temp = data.current_weather.temperature;
    const code = data.current_weather.weathercode;

    const weatherMap = {
        0: "快晴",
        1: "晴れ",
        2: "薄曇り",
        3: "曇り",
        45: "霧",
        61: "雨",
        71: "雪"
    };

    document.getElementById("temperature").textContent = `${temp}°C`;
    document.getElementById("weather-text").textContent = weatherMap[code] || "不明";
}

// 起動
setInterval(updateClock, 1000);
updateClock();
loadWeather();
