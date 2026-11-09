// Keep the route loading state aligned with the Football Wizard introduction.
export default function PredictLoading() {
  return (
    <div className="intro-page" aria-busy="true">
      <section className="intro-hero intro-hero--loading" aria-labelledby="intro-loading-title">
        <div className="intro-hero__grid" aria-hidden="true" />
        <div className="intro-hero__content">
          <h1 id="intro-loading-title" className="intro-hero__title">Football Wizard</h1>
          <p className="intro-hero__pitch">Premier League predictions from three models, checked honestly against real results.</p>
        </div>
      </section>
      <section className="intro-panel intro-panel--loading" aria-label="Loading Football Wizard">
        <div className="intro-panel__inner">
          <div className="intro-loading-block" />
          <div className="intro-loading-block intro-loading-block--cards" />
        </div>
      </section>
    </div>
  );
}
