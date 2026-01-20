import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Preview() {
  const navigate = useNavigate();
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<{ success: boolean; message: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRunning, setPreviewRunning] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);
  const [sitePath, setSitePath] = useState('');
  const [distPath, setDistPath] = useState('');

  // Sample data loading state
  const [loadingSampleData, setLoadingSampleData] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [existingBookCount, setExistingBookCount] = useState(0);
  const [sampleDataResult, setSampleDataResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    async function loadPaths() {
      const [site, dist] = await Promise.all([
        window.electronAPI.getSitePath(),
        window.electronAPI.getDistPath()
      ]);
      setSitePath(site);
      setDistPath(dist);
    }
    loadPaths();
  }, []);

  async function handleBuild() {
    setBuilding(true);
    setBuildResult(null);

    try {
      const result = await window.electronAPI.buildSite(useSampleData);
      setBuildResult(result);
    } catch (error) {
      setBuildResult({
        success: false,
        message: error instanceof Error ? error.message : 'Build failed'
      });
    } finally {
      setBuilding(false);
    }
  }

  async function handleStartPreview() {
    try {
      const info = await window.electronAPI.startPreviewServer();
      setPreviewUrl(info.url);
      setPreviewRunning(true);
    } catch (error) {
      setBuildResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start preview server'
      });
    }
  }

  async function handleStopPreview() {
    try {
      await window.electronAPI.stopPreviewServer();
      setPreviewUrl(null);
      setPreviewRunning(false);
    } catch (error) {
      console.error('Failed to stop preview server:', error);
    }
  }

  async function handleOpenInBrowser() {
    if (previewUrl) {
      await window.electronAPI.openInBrowser(previewUrl);
    }
  }

  async function handleOpenDistFolder() {
    await window.electronAPI.openInFileExplorer(distPath);
  }

  async function handleLoadSampleDataClick() {
    setSampleDataResult(null);

    try {
      const { count } = await window.electronAPI.checkExistingBooks();
      setExistingBookCount(count);
      setShowConfirmDialog(true);
    } catch (error) {
      setSampleDataResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check existing books'
      });
    }
  }

  async function handleConfirmLoadSampleData() {
    setShowConfirmDialog(false);
    setLoadingSampleData(true);
    setSampleDataResult(null);

    try {
      const result = await window.electronAPI.loadSampleData();

      if (result.success) {
        setSampleDataResult({
          success: true,
          message: `${result.message}. Navigating to Books page...`
        });
        // Navigate to Books page after a short delay so user sees success message
        setTimeout(() => {
          navigate('/books');
        }, 1500);
      } else {
        setSampleDataResult({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      setSampleDataResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load sample data'
      });
    } finally {
      setLoadingSampleData(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Build & Preview</h1>
        <p className="page-subtitle">Build your site and preview it locally</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Build Site</h2>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Build the static site from your book data. The output will be placed in the <code>dist/</code> folder.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useSampleData}
                onChange={(e) => setUseSampleData(e.target.checked)}
              />
              <span style={{ fontSize: '14px' }}>Use sample data (for testing)</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleBuild}
              disabled={building}
            >
              {building ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Building...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Build Site
                </>
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleOpenDistFolder}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              Open dist/
            </button>
          </div>

          {buildResult && (
            <div
              className={`alert ${buildResult.success ? 'alert-success' : 'alert-error'}`}
              style={{ marginTop: '16px' }}
            >
              {buildResult.message}
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>Source:</strong> {sitePath}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <strong>Output:</strong> {distPath}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Preview Server</h2>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Start a local server to preview your built site. Make sure to build the site first.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            {!previewRunning ? (
              <button
                className="btn btn-primary"
                onClick={handleStartPreview}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Server
              </button>
            ) : (
              <>
                <button
                  className="btn btn-danger"
                  onClick={handleStopPreview}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Server
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleOpenInBrowser}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Browser
                </button>
              </>
            )}
          </div>

          {previewRunning && previewUrl && (
            <div
              style={{
                padding: '12px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-success">Running</span>
                <code style={{ fontSize: '13px' }}>{previewUrl}</code>
              </div>
            </div>
          )}

          {previewRunning && (
            <div
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                height: '400px'
              }}
            >
              <iframe
                src={previewUrl || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Site Preview"
              />
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Sample Data</h2>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          Load sample books to get started quickly. This will copy books from the sample data folder
          into your books folder and configure the default shelves. Your existing books will not be deleted.
        </p>

        <button
          className="btn btn-secondary"
          onClick={handleLoadSampleDataClick}
          disabled={loadingSampleData}
        >
          {loadingSampleData ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              Loading...
            </>
          ) : (
            <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Load Sample Data
            </>
          )}
        </button>

        {sampleDataResult && (
          <div
            className={`alert ${sampleDataResult.success ? 'alert-success' : 'alert-error'}`}
            style={{ marginTop: '16px' }}
          >
            {sampleDataResult.message}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Deployment</h2>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
          After building, deploy the <code>dist/</code> folder to any static hosting service.
        </p>

        <div className="grid grid-3">
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>GitHub Pages</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Push the dist/ contents to a gh-pages branch
            </p>
          </div>
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Netlify</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Drag and drop the dist/ folder to Netlify
            </p>
          </div>
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>AWS S3</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Sync dist/ to an S3 bucket with static hosting
            </p>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowConfirmDialog(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '400px',
              margin: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Load Sample Data</h2>
            <p style={{ marginBottom: '16px' }}>
              {existingBookCount > 0
                ? `This will add sample books alongside your ${existingBookCount} existing book${existingBookCount === 1 ? '' : 's'}. Your current books will not be deleted.`
                : 'This will copy sample books to your books folder and configure the default shelves.'
              }
            </p>
            <p style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Continue?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmLoadSampleData}
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
