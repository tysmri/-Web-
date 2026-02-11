// 中間色
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
}

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

    const darkMap = {
        95:0.5
    };

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

function backgroundColor(weatherCode) {
    const now = new Date();

    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");

    const totalSeconds = (hours * 3600) + (now.getMinutes() * 60) + now.getSeconds();
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

    [currentTop, currentBottom] = applyWeatherFilter(currentTop, currentBottom, weatherCode);

    const clamp = n => Math.min(Math.max(n, 0), 255);
    currentTop = currentTop.map(clamp);
    currentBottom = currentBottom.map(clamp);

    document.body.style.background =
        `linear-gradient(180deg, rgb(${currentTop.join(",")}) 0%, rgb(${currentBottom.join(",")}) 100%)`;
}

// 天気取得（東京固定）
async function loadWeather() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.76&current_weather=true";

    const res = await fetch(url);
    const data = await res.json();

    const temp = data.current_weather.temperature;
    const code = data.current_weather.weathercode;

    const weatherMap = {
    0:"快晴",
    1:"晴れ",
    2:"薄曇り",
    3:"曇り",

    45:"霧",
    48:"着氷霧",

    51:"弱い霧雨",
    53:"霧雨",
    55:"強い霧雨",

    61:"弱い雨",
    63:"雨",
    65:"強い雨",

    71:"弱い雪",
    73:"雪",
    75:"強い雪",

    80:"にわか雨",
    81:"強いにわか雨",
    82:"激しいにわか雨",

    95:"雷雨"
    };

    document.getElementById("temperature").textContent = `${temp}°C`;
    document.getElementById("weather-text").textContent = weatherMap[code] ?? `code:${code}`;
    console.log("weather code:", code);

    backgroundColor(code);
}

updateClock();
setInterval(updateClock, 1000);
loadWeather();
setInterval(loadWeather, 300000);


