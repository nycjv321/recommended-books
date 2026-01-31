import { useState, useEffect } from 'react';
import type { Config } from '@/types';
import { useConfigRepository, useSettingsRepository, useCoverRepository } from '@/repositories';
import type { SiteValidation, TemplateUpdateInfo, DownloadAllCoversResult } from '@/repositories/interfaces';

export default function ConfigEditor() {
  const configRepo = useConfigRepository();
  const settingsRepo = useSettingsRepository();
  const coverRepo = useCoverRepository();

  const [config, setConfig] = useState<Config | null>(null);
  const [sitePath, setSitePathState] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    siteTitle: '',
    siteSubtitle: '',
    footerText: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [changingSite, setChangingSite] = useState(false);
  const [pendingSitePath, setPendingSitePath] = useState<string | null>(null);
  const [pendingValidation, setPendingValidation] = useState<SiteValidation | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateUpdateInfo | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [downloadingCovers, setDownloadingCovers] = useState(false);
  const [coverDownloadResult, setCoverDownloadResult] = useState<DownloadAllCoversResult | null>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [configData, settings] = await Promise.all([
          configRepo.get(),
          settingsRepo.get()
        ]);
        setConfig(configData);
        setSitePathState(settings.libraryPath);
        setFormData({
          siteTitle: configData.siteTitle,
          siteSubtitle: configData.siteSubtitle,
          footerText: configData.footerText
        });

        // Check template version
        if (settings.libraryPath) {
          const updateInfo = await settingsRepo.checkTemplateUpdates(settings.libraryPath);
          setTemplateInfo(updateInfo);
        }
      } catch (err) {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [configRepo, settingsRepo]);

  async function handleCheckTemplateUpdates() {
    if (!sitePath) return;

    setCheckingUpdates(true);
    setError('');

    try {
      const updateInfo = await settingsRepo.checkTemplateUpdates(sitePath);
      setTemplateInfo(updateInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for template updates');
    } finally {
      setCheckingUpdates(false);
    }
  }

  async function handleUpdateTemplate() {
    if (!sitePath) return;

    setUpdatingTemplate(true);
    setError('');

    try {
      await settingsRepo.updateSiteTemplate(sitePath);
      // Re-check to get new version info
      const updateInfo = await settingsRepo.checkTemplateUpdates(sitePath);
      setTemplateInfo(updateInfo);
      setShowUpdateConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setUpdatingTemplate(false);
    }
  }

  async function handleDownloadAllCovers() {
    setDownloadingCovers(true);
    setError('');
    setCoverDownloadResult(null);

    try {
      const result = await coverRepo.downloadAll();
      setCoverDownloadResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download covers');
    } finally {
      setDownloadingCovers(false);
    }
  }

  async function handleChangeSitePath() {
    setChangingSite(true);
    setError('');
    setPendingSitePath(null);
    setPendingValidation(null);

    try {
      const newPath = await settingsRepo.selectSitePath();
      if (!newPath) {
        setChangingSite(false);
        return; // User cancelled
      }

      const validation = await settingsRepo.validateSitePath(newPath);
      setPendingValidation(validation);

      if (!validation.isValid) {
        // Missing template files - not a valid site
        setPendingSitePath(newPath);
        setChangingSite(false);
        return;
      }

      if (!validation.hasConfig || !validation.hasBooks) {
        // Valid site but needs data initialization
        setPendingSitePath(newPath);
        setChangingSite(false);
        return;
      }

      // Fully valid site, switch to it
      await settingsRepo.save({ libraryPath: newPath });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change site folder');
      setChangingSite(false);
    }
  }

  async function handleInitializeSiteData() {
    if (!pendingSitePath) return;

    setChangingSite(true);
    setError('');

    try {
      await settingsRepo.initializeSiteData(pendingSitePath);
      await settingsRepo.save({ libraryPath: pendingSitePath });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize site data');
      setChangingSite(false);
    }
  }

  function handleCancelPending() {
    setPendingSitePath(null);
    setPendingValidation(null);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      if (!config) return;

      const updatedConfig: Config = {
        ...config,
        siteTitle: formData.siteTitle.trim(),
        siteSubtitle: formData.siteSubtitle.trim(),
        footerText: formData.footerText.trim()
      };

      await configRepo.save(updatedConfig);
      setConfig(updatedConfig);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!config) return;
    setFormData({
      siteTitle: config.siteTitle,
      siteSubtitle: config.siteSubtitle,
      footerText: config.footerText
    });
    setError('');
    setSuccess(false);
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasChanges = config && (
    formData.siteTitle !== config.siteTitle ||
    formData.siteSubtitle !== config.siteSubtitle ||
    formData.footerText !== config.footerText
  );

  // Determine pending state type
  const isInvalidSite = pendingSitePath && pendingValidation && !pendingValidation.isValid;
  const needsInitialization = pendingSitePath && pendingValidation && pendingValidation.isValid && (!pendingValidation.hasConfig || !pendingValidation.hasBooks);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Site Configuration</h1>
        <p className="page-subtitle">Customize your book recommendation site</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Configuration saved successfully!</div>}

      {isInvalidSite && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--color-danger)' }}>
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Not a Valid Site Folder</h2>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
            The selected folder is missing required template files.
          </p>
          <div style={{
            background: 'var(--color-bg)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontFamily: 'monospace',
            fontSize: '13px',
            wordBreak: 'break-all'
          }}>
            {pendingSitePath}
          </div>
          {pendingValidation?.missingFiles && pendingValidation.missingFiles.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px' }}>Missing files:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {pendingValidation.missingFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancelPending}
          >
            Cancel
          </button>
        </div>
      )}

      {needsInitialization && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--color-primary)' }}>
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Initialize Site Data?</h2>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
            This site folder has template files but is missing some data files.
          </p>
          <div style={{
            background: 'var(--color-bg)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontFamily: 'monospace',
            fontSize: '13px',
            wordBreak: 'break-all'
          }}>
            {pendingSitePath}
          </div>
          <div style={{ marginBottom: '16px', fontSize: '13px' }}>
            <strong>Will create:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: 'var(--color-text-secondary)' }}>
              {!pendingValidation?.hasConfig && <li>config.json (site configuration)</li>}
              {!pendingValidation?.hasBooks && <li>books/ folder (for your book data)</li>}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleInitializeSiteData}
              disabled={changingSite}
            >
              {changingSite ? 'Initializing...' : 'Initialize & Switch'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelPending}
              disabled={changingSite}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Site Folder</h2>
        <div className="library-path-section">
          <div className="library-path-info">
            <div className="library-path-label">Current site folder</div>
            <div className="library-path-value">{sitePath || 'Not configured'}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleChangeSitePath}
            disabled={changingSite || pendingSitePath !== null}
            style={{ marginLeft: '16px', flexShrink: 0 }}
          >
            {changingSite ? 'Changing...' : 'Change Location'}
          </button>
        </div>
        <p className="form-hint">
          Changing the site folder will reload the app.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Template Version</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div className="library-path-label">Current version</div>
            <div className="library-path-value" style={{ fontSize: '14px' }}>
              {templateInfo?.currentVersion || (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Pre-versioning
                </span>
              )}
            </div>
          </div>
          {templateInfo?.hasUpdate && (
            <div style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 500
            }}>
              {templateInfo.currentVersion
                ? `Update available: ${templateInfo.latestVersion}`
                : `Version ${templateInfo.latestVersion} available`}
            </div>
          )}
        </div>

        {showUpdateConfirm ? (
          <div style={{
            background: 'var(--color-bg)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '12px'
          }}>
            <p style={{ marginBottom: '12px', fontSize: '13px' }}>
              This will update the template files (index.html, app.js, styles, scripts).
              Your books and configuration will not be affected.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdateTemplate}
                disabled={updatingTemplate}
              >
                {updatingTemplate ? 'Updating...' : 'Confirm Update'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUpdateConfirm(false)}
                disabled={updatingTemplate}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCheckTemplateUpdates}
              disabled={checkingUpdates}
            >
              {checkingUpdates ? 'Checking...' : 'Check for Updates'}
            </button>
            {templateInfo?.hasUpdate && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowUpdateConfirm(true)}
              >
                Update Template
              </button>
            )}
          </div>
        )}
        <p className="form-hint" style={{ marginTop: '8px' }}>
          Template updates include improvements to the site engine (HTML, CSS, JS).
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Cover Images</h2>
        <p style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Download all book covers locally to avoid relying on external image sources.
          This will download covers from URLs and store them in the <code>books/covers/</code> folder.
        </p>

        {coverDownloadResult && (
          <div style={{
            background: coverDownloadResult.success ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-warning-bg, #fffbeb)',
            border: `1px solid ${coverDownloadResult.success ? 'var(--color-success, #22c55e)' : 'var(--color-warning, #f59e0b)'}`,
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '12px',
            fontSize: '13px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Download complete:</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>{coverDownloadResult.downloaded} cover{coverDownloadResult.downloaded !== 1 ? 's' : ''} downloaded</li>
              <li>{coverDownloadResult.skipped} book{coverDownloadResult.skipped !== 1 ? 's' : ''} skipped (already local or no cover)</li>
              {coverDownloadResult.failed > 0 && (
                <li style={{ color: 'var(--color-danger)' }}>
                  {coverDownloadResult.failed} failed
                </li>
              )}
            </ul>
            {coverDownloadResult.errors.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <strong>Errors:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                  {coverDownloadResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownloadAllCovers}
          disabled={downloadingCovers}
        >
          {downloadingCovers ? 'Downloading...' : 'Download All Covers Locally'}
        </button>
        <p className="form-hint" style={{ marginTop: '8px' }}>
          Books with existing local covers will be skipped. Book JSON files will be updated with the local cover path.
        </p>
      </div>

      <div className="grid grid-2">
        <div>
          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: '16px' }}>Site Details</h2>

              <div className="form-group">
                <label className="form-label">Site Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                  placeholder="My Reads"
                />
                <p className="form-hint">The main title shown at the top of the site</p>
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.siteSubtitle}
                  onChange={(e) => setFormData({ ...formData, siteSubtitle: e.target.value })}
                  placeholder="Books that shaped my career"
                />
                <p className="form-hint">Appears below the main title</p>
              </div>

              <div className="form-group">
                <label className="form-label">Footer Text</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Books I love and books to explore"
                />
                <p className="form-hint">Shown in the page footer</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !hasChanges}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {hasChanges && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div>
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Preview</h2>
            <div
              style={{
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                {formData.siteTitle || 'Site Title'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                {formData.siteSubtitle || 'Site subtitle'}
              </p>
              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '16px',
                  marginTop: '16px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)'
                }}
              >
                {formData.footerText || 'Footer text'}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h2 className="card-title" style={{ marginBottom: '16px' }}>Configuration File</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              These settings are stored in <code>config.json</code> and applied during build.
            </p>
            <pre
              style={{
                background: 'var(--color-bg)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                overflow: 'auto'
              }}
            >
              {JSON.stringify({
                siteTitle: formData.siteTitle,
                siteSubtitle: formData.siteSubtitle,
                footerText: formData.footerText,
                shelves: config?.shelves.map(s => ({ id: s.id, label: s.label, folder: s.folder })) || []
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
