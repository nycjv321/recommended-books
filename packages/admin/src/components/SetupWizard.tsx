import { useState } from 'react';
import { useSettingsRepository } from '@/repositories';
import type { SiteValidation } from '@/repositories/interfaces';

interface SetupWizardProps {
  onComplete: () => void;
}

type WizardStep = 'welcome' | 'invalid-site' | 'initialize-data';

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const settingsRepo = useSettingsRepository();

  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [validation, setValidation] = useState<SiteValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelectFolder() {
    setError(null);
    const path = await settingsRepo.selectSitePath();

    if (!path) {
      return; // User cancelled
    }

    setSelectedPath(path);
    setLoading(true);

    try {
      const result = await settingsRepo.validateSitePath(path);
      setValidation(result);

      if (!result.isValid) {
        // Missing template files - not a valid site folder
        setStep('invalid-site');
      } else if (!result.hasConfig || !result.hasBooks) {
        // Valid site but missing data files - offer to initialize
        setStep('initialize-data');
      } else {
        // Fully valid site, save and complete
        await settingsRepo.save({ libraryPath: path });
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate folder');
    } finally {
      setLoading(false);
    }
  }

  async function handleInitializeData() {
    if (!selectedPath) return;

    setLoading(true);
    setError(null);

    try {
      await settingsRepo.initializeSiteData(selectedPath);
      await settingsRepo.save({ libraryPath: selectedPath });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize site data');
    } finally {
      setLoading(false);
    }
  }

  function handleChooseDifferent() {
    setSelectedPath(null);
    setValidation(null);
    setStep('welcome');
  }

  if (loading) {
    return (
      <div className="setup-wizard">
        <div className="setup-wizard-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'invalid-site') {
    return (
      <div className="setup-wizard">
        <div className="setup-wizard-content">
          <div className="setup-wizard-icon" style={{ color: 'var(--color-danger)' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="setup-wizard-title">Not a Valid Site Folder</h1>
          <p className="setup-wizard-subtitle">
            The selected folder is missing required template files. Please select a folder containing
            the site template (e.g., <code>packages/site</code> from the repo).
          </p>
          <div className="setup-wizard-path">
            {selectedPath}
          </div>

          {validation?.missingFiles && validation.missingFiles.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'left', background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ fontSize: '13px' }}>Missing files:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {validation.missingFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <div className="setup-wizard-actions">
            <button className="btn btn-primary" onClick={handleChooseDifferent}>
              Choose Different Folder
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'initialize-data') {
    return (
      <div className="setup-wizard">
        <div className="setup-wizard-content">
          <div className="setup-wizard-icon">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="setup-wizard-title">Initialize Site Data?</h1>
          <p className="setup-wizard-subtitle">
            This site folder has the template files but is missing some data files.
            Would you like to create them?
          </p>
          <div className="setup-wizard-path">
            {selectedPath}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'left', background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
            <strong>Will create:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: 'var(--color-text-secondary)' }}>
              {!validation?.hasConfig && <li>config.json (site configuration)</li>}
              {!validation?.hasBooks && <li>books/ folder (for your book data)</li>}
            </ul>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="setup-wizard-actions">
            <button className="btn btn-primary" onClick={handleInitializeData}>
              Initialize Data
            </button>
            <button className="btn btn-secondary" onClick={handleChooseDifferent}>
              Choose Different Folder
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-wizard">
      <div className="setup-wizard-content">
        <div className="setup-wizard-icon">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="setup-wizard-title">Welcome to Book Admin</h1>
        <p className="setup-wizard-subtitle">
          To get started, select your site folder. This should be a folder containing
          the site template (e.g., <code>packages/site</code> from the repo).
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="setup-wizard-actions">
          <button className="btn btn-primary btn-lg" onClick={handleSelectFolder}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Select Site Folder
          </button>
        </div>
      </div>
    </div>
  );
}
