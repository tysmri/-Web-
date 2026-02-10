// 時計
function updateTime() {
  const now = new Date();
  const t = now.toLocaleTimeString();
  document.getElementById("time").textContent = t;
}
setInterval(updateTime, 1000);
updateTime();

// 天気（秋田の座標）
fetch("https://api.open-meteo.com/v1/forecast?latitude=39.72&longitude=140.10&current_weather=true")
  .then(res => res.json())
  .then(data => {
    const w = data.current_weather;
    document.getElementById("weather").textContent =
      `気温 ${w.temperature}°C / 風速 ${w.windspeed} km/h`;
  })
  .catch(() => {
    document.getElementById("weather").textContent = "天気取得に失敗";
  });
