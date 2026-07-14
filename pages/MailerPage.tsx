import React, { useEffect, useState } from 'react';
import { Mail, Loader2, ExternalLink } from 'lucide-react';
import { User } from '../types';
import { authenticateWithMailer, getMailerToken, isMailerAuthenticated } from '../services/equinoxMailerService';

interface MailerPageProps {
  user: User;
}

const MAILER_URL = import.meta.env.VITE_MAILER_URL || 'https://equinoxmailer.vercel.app';

export const MailerPage: React.FC<MailerPageProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Build the mailer URL with auto-login token if available
  const getMailerEmbedUrl = () => {
    const token = getMailerToken();
    if (token) {
      // Pass token via URL fragment so the mailer frontend can auto-login
      return `${MAILER_URL}#token=${token}`;
    }
    return MAILER_URL;
  };

  useEffect(() => {
    // Small delay to show loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/10 flex items-center justify-center">
            <Mail size={16} className="text-[#7C5CFC]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Equinox Mailer</h1>
            <p className="text-[11px] text-slate-400">Email campaign management</p>
          </div>
        </div>
        <a
          href={MAILER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-[#7C5CFC] hover:bg-[#F5F3FF] rounded-lg transition-all border border-slate-200"
        >
          <ExternalLink size={12} /> Open in new tab
        </a>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative bg-slate-50">
        {(isLoading || !iframeLoaded) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white">
            <Loader2 size={32} className="animate-spin text-[#7C5CFC] mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading Equinox Mailer...</p>
          </div>
        )}
        {!isLoading && (
          <iframe
            src={getMailerEmbedUrl()}
            className="w-full h-full border-0"
            title="Equinox Mailer"
            onLoad={() => setIframeLoaded(true)}
            allow="clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
          />
        )}
      </div>
    </div>
  );
};
