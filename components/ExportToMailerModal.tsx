import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import {
  isMailerAuthenticated,
  authenticateWithMailer,
  getMailerContactLists,
  exportToEquinoxMailer,
} from '../services/equinoxMailerService';
import { CarrierData } from '../types';

interface ExportToMailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  carriers: CarrierData[];
  userEmail: string;
}

type ModalStep = 'auth' | 'filename' | 'exporting' | 'success' | 'error';

export const ExportToMailerModal: React.FC<ExportToMailerModalProps> = ({
  isOpen,
  onClose,
  carriers,
  userEmail,
}) => {
  const [step, setStep] = useState<ModalStep>('filename');
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [existingLists, setExistingLists] = useState<{ listName: string; count: number }[]>([]);
  const [exportResult, setExportResult] = useState<{ count: number; error?: string }>({ count: 0 });
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [matchingList, setMatchingList] = useState<{ listName: string; count: number } | null>(null);

  // Check authentication status on open
  useEffect(() => {
    if (!isOpen) return;

    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const authenticated = await isMailerAuthenticated();
      if (authenticated) {
        setStep('filename');
        // Load existing lists
        const lists = await getMailerContactLists();
        setExistingLists(lists);
      } else {
        setStep('auth');
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [isOpen]);

  // Check if filename matches existing list
  useEffect(() => {
    if (fileName.trim()) {
      const match = existingLists.find(
        l => l.listName.toLowerCase() === fileName.trim().toLowerCase()
      );
      setMatchingList(match || null);
    } else {
      setMatchingList(null);
    }
  }, [fileName, existingLists]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setAuthError('');

    const success = await authenticateWithMailer(userEmail, password);
    if (success) {
      setStep('filename');
      const lists = await getMailerContactLists();
      setExistingLists(lists);
    } else {
      setAuthError('Authentication failed. Please check your password.');
    }

    setIsAuthenticating(false);
  };

  const handleExport = async () => {
    if (!fileName.trim()) return;

    setStep('exporting');
    setIsExporting(true);

    const result = await exportToEquinoxMailer(carriers, fileName.trim());

    setIsExporting(false);
    setExportResult({ count: result.count, error: result.error });

    if (result.success) {
      setStep('success');
    } else {
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('filename');
    setFileName('');
    setPassword('');
    setAuthError('');
    setExportResult({ count: 0 });
    setMatchingList(null);
    onClose();
  };

  if (!isOpen) return null;

  const carriersWithEmail = carriers.filter(c => c.email && c.email.trim() !== '');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/10 flex items-center justify-center">
              <Mail size={20} className="text-[#7C5CFC]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export to Equinox Mailer</h3>
              <p className="text-xs text-slate-500">
                {carriersWithEmail.length} contacts with email
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isCheckingAuth ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#7C5CFC] mb-3" />
              <p className="text-sm text-slate-500">Checking authentication...</p>
            </div>
          ) : step === 'auth' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  Please enter your password to connect to Equinox Mailer. Both platforms share the same credentials.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuthenticate()}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs text-red-500 font-medium">{authError}</p>
              )}
              <button
                onClick={handleAuthenticate}
                disabled={!password || isAuthenticating}
                className="w-full py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Authenticating...
                  </>
                ) : (
                  'Connect & Continue'
                )}
              </button>
            </div>
          ) : step === 'filename' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  File / List Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fileName.trim() && handleExport()}
                  placeholder="Enter a name for this export..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10"
                  autoFocus
                />
              </div>

              {matchingList && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                  <FileText size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    A list named <span className="font-bold">"{matchingList.listName}"</span> already exists with{' '}
                    <span className="font-bold">{matchingList.count}</span> contacts. New contacts will be added to this existing list.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                <p className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">{carriersWithEmail.length}</span> contacts will be exported
                </p>
                <p className="text-[10px] text-slate-400">
                  Only carriers with email addresses are included. Data exported: Email, Company Name, DOT#, MC#, Phone, Address, Officer Name.
                </p>
              </div>

              <button
                onClick={handleExport}
                disabled={!fileName.trim()}
                className="w-full py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <Mail size={14} /> Export to Equinox Mailer
              </button>
            </div>
          ) : step === 'exporting' ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 size={32} className="animate-spin text-[#7C5CFC] mb-4" />
              <p className="text-sm font-bold text-slate-700">Exporting to Equinox Mailer...</p>
              <p className="text-xs text-slate-400 mt-1">
                Uploading {carriersWithEmail.length} contacts
              </p>
            </div>
          ) : step === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <p className="text-base font-bold text-slate-900 mb-1">Export Successful!</p>
              <p className="text-sm text-slate-500 text-center">
                <span className="font-bold text-emerald-600">{exportResult.count}</span> contacts exported to list{' '}
                <span className="font-bold text-[#7C5CFC]">"{fileName}"</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                You can find them in Equinox Mailer → Contacts
              </p>
              <button
                onClick={handleClose}
                className="mt-5 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Done
              </button>
            </div>
          ) : step === 'error' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <p className="text-base font-bold text-slate-900 mb-1">Export Failed</p>
              <p className="text-sm text-red-500 text-center">{exportResult.error}</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setStep('filename')}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
