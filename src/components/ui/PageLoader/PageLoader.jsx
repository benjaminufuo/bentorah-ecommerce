import './PageLoader.css';

const PageLoader = () => (
  <div className="page-loader" aria-label="Loading page" role="status">
    <div className="page-loader__spinner">
      <div className="page-loader__ring"></div>
    </div>
  </div>
);

export default PageLoader;
