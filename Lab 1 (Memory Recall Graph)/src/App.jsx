const memoryData = [
  { week: 'W1', after10Min: 5, after24Hours: 3 },
  { week: 'W2', after10Min: 4, after24Hours: 2 },
  { week: 'W3', after10Min: 6, after24Hours: 2 },
  { week: 'W4', after10Min: 5, after24Hours: 3 },
  { week: 'W5', after10Min: 6, after24Hours: 2 },
  { week: 'W6', after10Min: 8, after24Hours: 4 },
  { week: 'W7', after10Min: 4, after24Hours: 1 },
  { week: 'W8', after10Min: 5, after24Hours: 2 },
  { week: 'W9', after10Min: 8, after24Hours: 3 },
  { week: 'W10', after10Min: 4, after24Hours: 2 },
  { week: 'W11', after10Min: 7, after24Hours: 4 },
  { week: 'W12', after10Min: 10, after24Hours: 7 },
  { week: 'W13', after10Min: 11, after24Hours: 9 },
];

const chart = {
  width: 840,
  height: 420,
  paddingTop: 28,
  paddingRight: 24,
  paddingBottom: 52,
  paddingLeft: 56,
  maxValue: 12,
};

function average(values) {
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function buildLinePath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

function App() {
  const innerWidth = chart.width - chart.paddingLeft - chart.paddingRight;
  const innerHeight = chart.height - chart.paddingTop - chart.paddingBottom;
  const stepX = innerWidth / (memoryData.length - 1);

  const tenMinutePoints = memoryData.map((item, index) => ({
    ...item,
    x: chart.paddingLeft + stepX * index,
    y: chart.paddingTop + innerHeight - (item.after10Min / chart.maxValue) * innerHeight,
    value: item.after10Min,
  }));

  const after24HourPoints = memoryData.map((item, index) => ({
    ...item,
    x: chart.paddingLeft + stepX * index,
    y: chart.paddingTop + innerHeight - (item.after24Hours / chart.maxValue) * innerHeight,
    value: item.after24Hours,
  }));

  const yTicks = Array.from({ length: chart.maxValue + 1 }, (_, index) => chart.maxValue - index);
  const avg10Min = average(memoryData.map((item) => item.after10Min));
  const avg24Hours = average(memoryData.map((item) => item.after24Hours));

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">HCI Lab 1</p>
          <h1>Memory Recall Graph</h1>
          <p className="hero-text">
            A visual comparison of how many concepts were remembered after 10 minutes versus after
            24 hours of lecture across 13 weeks.
          </p>
        </div>

        <div className="stat-strip">
          <article className="stat-card">
            <span>Weeks Observed</span>
            <strong>13</strong>
          </article>
          <article className="stat-card">
            <span>Avg. After 10 Min</span>
            <strong>{avg10Min}</strong>
          </article>
          <article className="stat-card">
            <span>Avg. After 24 Hours</span>
            <strong>{avg24Hours}</strong>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="chart-card">
          <div className="section-heading">
            <div>
              <p className="section-tag">Recall Time Analysis</p>
              <h2>Lecture memory retention across the semester</h2>
            </div>

            <div className="legend">
              <div className="legend-item">
                <span className="legend-swatch legend-swatch-blue" />
                <span>After 10 min</span>
              </div>
              <div className="legend-item">
                <span className="legend-swatch legend-swatch-ink" />
                <span>After 24 hours</span>
              </div>
            </div>
          </div>

          <div className="chart-frame">
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="memory-chart"
              role="img"
              aria-label="Memory recall line chart showing after 10 minutes and after 24 hours for 13 weeks"
            >
              {yTicks.map((tick) => {
                const y = chart.paddingTop + innerHeight - (tick / chart.maxValue) * innerHeight;

                return (
                  <g key={tick}>
                    <line
                      x1={chart.paddingLeft}
                      y1={y}
                      x2={chart.width - chart.paddingRight}
                      y2={y}
                      className="grid-line"
                    />
                    <text x={chart.paddingLeft - 14} y={y + 5} className="axis-label axis-label-y">
                      {tick}
                    </text>
                  </g>
                );
              })}

              <line
                x1={chart.paddingLeft}
                y1={chart.paddingTop}
                x2={chart.paddingLeft}
                y2={chart.height - chart.paddingBottom}
                className="axis-line"
              />
              <line
                x1={chart.paddingLeft}
                y1={chart.height - chart.paddingBottom}
                x2={chart.width - chart.paddingRight}
                y2={chart.height - chart.paddingBottom}
                className="axis-line"
              />

              <path d={buildLinePath(tenMinutePoints)} className="line-path line-path-blue" />
              <path d={buildLinePath(after24HourPoints)} className="line-path line-path-ink" />

              {tenMinutePoints.map((point) => (
                <g key={`ten-${point.week}`}>
                  <circle cx={point.x} cy={point.y} r="5.5" className="point-fill point-fill-blue" />
                  <text x={point.x} y={point.y - 14} className="point-label point-label-blue">
                    {point.value}
                  </text>
                  <text
                    x={point.x}
                    y={chart.height - chart.paddingBottom + 26}
                    className="axis-label axis-label-x"
                  >
                    {point.week}
                  </text>
                </g>
              ))}

              {after24HourPoints.map((point) => (
                <g key={`day-${point.week}`}>
                  <circle cx={point.x} cy={point.y} r="5.5" className="point-fill point-fill-ink" />
                  <text x={point.x} y={point.y - 14} className="point-label point-label-ink">
                    {point.value}
                  </text>
                </g>
              ))}

              <text
                x={chart.width / 2}
                y={chart.height - 10}
                className="axis-title axis-title-horizontal"
              >
                Weeks Throughout the Course
              </text>
              <text
                x="20"
                y={chart.height / 2}
                className="axis-title axis-title-vertical"
                transform={`rotate(-90 20 ${chart.height / 2})`}
              >
                Number of Concepts Recalled
              </text>
            </svg>
          </div>
        </article>

        <aside className="insight-panel">
          <article className="info-card">
            <p className="section-tag">Observation</p>
            <h3>Short-term recall stays higher</h3>
            <p>
              In every week, the recall score after 10 minutes is stronger than the score after 24
              hours, showing a clear drop in remembered concepts over time.
            </p>
          </article>

          <article className="info-card">
            <p className="section-tag">Peak Week</p>
            <h3>Week 13 had the highest recall</h3>
            <p>
              The strongest results appear at the end of the course, where recall rises to
              <strong> 11 </strong> after 10 minutes and <strong>9</strong> after 24 hours.
            </p>
          </article>

          <article className="info-card">
            <p className="section-tag">Lab Summary</p>
            <p className="summary-line">This graph demonstrates the effect of recall time on memory retention.</p>
            <p className="summary-line">
              Students remember more concepts immediately after the lecture than they do one day
              later.
            </p>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default App;
