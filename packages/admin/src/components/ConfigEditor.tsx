import { useState, useEffect } from 'react';
import type { Config } from '@/types';
import { useConfigRepository, useSettingsRepository } from '@/repositories';

export default function ConfigEditor() {
  const configRepo = useConfigRepository();
  const settingsRepo = useSettingsRepository();

  const [config, setConfig] = useState<Config | null>(null);
  const [libraryPath, setLibraryPathState] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    siteTitle: '',
    siteSubtitle: '',
    footerText: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [changingLibrary, setChangingLibrary] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [configData, settings] = await Promise.all([
          configRepo.get(),
          settingsRepo.get()
        ]);
        setConfig(configData);
        setLibraryPathState(settings.libraryPath);
        setFormData({
          siteTitle: configData.siteTitle,
          siteSubtitle: configData.siteSubtitle,
          footerText: configData.footerText
        });
      } catch (err) {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [configRepo, settingsRepo]);

  async function handleChangeLibraryPath() {
    setChangingLibrary(true);
    setError('');

    try {
      const newPath = await settingsRepo.selectLibraryPath();
      if (!newPath) {
        setChangingLibrary(false);
        return; // User cancelled
      }

      const validation = await settingsRepo.validateLibraryPath(newPath);
      if (!validation.isValid) {
        setError('Selected folder does not contain a valid book library (no config.json found)');
        setChangingLibrary(false);
        return;
      }

      const settings = await settingsRepo.get();
      settings.libraryPath = newPath;
      await settingsRepo.save(settings);
      // Reload the app to use the new library
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change library path');
      setChangingLibrary(false);
    }
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Site Configuration</h1>
        <p className="page-subtitle">Customize your book recommendation site</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Configuration saved successfully!</div>}

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Library Location</h2>
        <div className="library-path-section">
          <div className="library-path-info">
            <div className="library-path-label">Current library folder</div>
            <div className="library-path-value">{libraryPath || 'Not configured'}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleChangeLibraryPath}
            disabled={changingLibrary}
            style={{ marginLeft: '16px', flexShrink: 0 }}
          >
            {changingLibrary ? 'Changing...' : 'Change Location'}
          </button>
        </div>
        <p className="form-hint">
          Changing the library location will reload the app.
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
