export default function StorefrontRouteLoading() {
  return (
    <div className="tsq-route-loading" aria-label="Đang tải trang">
      <div className="tsq-route-loading-header">
        <span className="tsq-route-loading-logo" />
        <div className="tsq-route-loading-nav">
          <span />
          <span />
          <span />
        </div>
      </div>
      <main className="tsq-product-loading">
        <div className="tsq-product-loading-media" />
        <section className="tsq-product-loading-info">
          <span className="tsq-product-loading-line short" />
          <span className="tsq-product-loading-title" />
          <span className="tsq-product-loading-line" />
          <span className="tsq-product-loading-line medium" />
          <span className="tsq-product-loading-price" />
          <div className="tsq-product-loading-actions">
            <span />
            <span />
          </div>
        </section>
      </main>
    </div>
  );
}
