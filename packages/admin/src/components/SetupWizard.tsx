import { useState } from 'react';
import { useSettingsRepository } from '@/repositories';

interface SetupWizardProps {
  onComplete: () => void;
}

type WizardStep = 'welcome' | 'select' | 'confirm-new';

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const settingsRepo = useSettingsRepository();

  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSelectFolder() {
    setError(null);
    const path = await settingsRepo.selectLibraryPath();

    if (!path) {
      return; // User cancelled
    }

    setSelectedPath(path);
    setLoading(true);

    try {
      const validation = await settingsRepo.validateLibraryPath(path);

      if (validation.isValid) {
        // Valid library found, save and complete
        await settingsRepo.save({ libraryPath: path });
        onComplete();
      } else {
        // Empty folder, ask user what to do
        setStep('confirm-new');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate folder');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNewLibrary() {
    if (!selectedPath) return;

    setLoading(true);
    setError(null);

    try {
      await settingsRepo.initializeLibrary(selectedPath);
      await settingsRepo.save({ libraryPath: selectedPath });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create library');
    } finally {
      setLoading(false);
    }
  }

  function handleChooseDifferent() {
    setSelectedPath(null);
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

  if (step === 'confirm-new') {
    return (
      <div className="setup-wizard">
        <div className="setup-wizard-content">
          <div className="setup-wizard-icon">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="setup-wizard-title">Create New Library?</h1>
          <p className="setup-wizard-subtitle">
            The selected folder doesn't contain a book library.
          </p>
          <div className="setup-wizard-path">
            {selectedPath}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="setup-wizard-actions">
            <button className="btn btn-primary" onClick={handleCreateNewLibrary}>
              Create New Library
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
          To get started, select a folder to store your book library. This can be an existing library or a new empty folder.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="setup-wizard-actions">
          <button className="btn btn-primary btn-lg" onClick={handleSelectFolder}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Select Library Folder
          </button>
        </div>
      </div>
    </div>
  );
}
