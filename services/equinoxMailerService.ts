/**
 * Equinox Mailer API Service
 * Handles exporting carrier data to the Equinox Mailer platform.
 * Both platforms share the same user credentials (email/password).
 */

const MAILER_BACKEND_URL = import.meta.env.VITE_MAILER_BACKEND_URL || 'https://mail-backend-6-production.up.railway.app';

// Token management for mailer - separate from FreightIntel token
const MAILER_TOKEN_KEY = 'equinox_mailer_token';

export const getMailerToken = (): string | null => localStorage.getItem(MAILER_TOKEN_KEY);
export const setMailerToken = (token: string): void => localStorage.setItem(MAILER_TOKEN_KEY, token);
export const clearMailerToken = (): void => localStorage.removeItem(MAILER_TOKEN_KEY);

function mailerAuthHeaders(): Record<string, string> {
  const token = getMailerToken();
  if (token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }
  return { 'Content-Type': 'application/json' };
}

/**
 * Authenticate with the Equinox Mailer backend using the same credentials.
 * This is called automatically when exporting if no token exists.
 */
export const authenticateWithMailer = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch(`${MAILER_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error('Mailer auth failed:', response.status);
      return false;
    }

    const data = await response.json();
    if (data.token) {
      setMailerToken(data.token);
      return true;
    }
    return false;
  } catch (err: any) {
    console.error('Mailer authentication error:', err);
    return false;
  }
};

/**
 * Check if the current mailer token is valid by calling /api/auth/me
 */
export const isMailerAuthenticated = async (): Promise<boolean> => {
  const token = getMailerToken();
  if (!token) return false;

  try {
    const response = await fetch(`${MAILER_BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get existing contact lists from the mailer to check if a list name already exists.
 */
export const getMailerContactLists = async (): Promise<{ listName: string; count: number }[]> => {
  try {
    const response = await fetch(`${MAILER_BACKEND_URL}/api/contacts/lists`, {
      headers: mailerAuthHeaders(),
    });

    if (!response.ok) {
      console.error('Failed to fetch mailer contact lists:', response.status);
      return [];
    }

    return await response.json();
  } catch (err: any) {
    console.error('Error fetching mailer contact lists:', err);
    return [];
  }
};

/**
 * Export carrier data to Equinox Mailer as contacts.
 * If a list with the same name already exists, contacts are appended to it.
 */
export const exportToEquinoxMailer = async (
  carriers: Array<{
    email?: string;
    legalName?: string;
    phone?: string;
    dotNumber?: string;
    mcNumber?: string;
    physicalAddress?: string;
    companyOfficer1?: string;
  }>,
  listName: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    // Filter carriers that have emails
    const contactsWithEmail = carriers.filter(c => c.email && c.email.trim() !== '');

    if (contactsWithEmail.length === 0) {
      return { success: false, count: 0, error: 'No carriers with email addresses found in the current data.' };
    }

    // Transform carrier data to mailer contact format
    const contacts = contactsWithEmail.map(carrier => ({
      id: `fi-${carrier.dotNumber || carrier.mcNumber || Math.random().toString(36).substr(2, 9)}`,
      email: carrier.email!.trim(),
      name: carrier.legalName || '',
      listName: listName,
      company: carrier.legalName || '',
      firstName: carrier.companyOfficer1 ? carrier.companyOfficer1.split(' ')[0] : '',
      variables: {
        dotNumber: carrier.dotNumber || '',
        mcNumber: carrier.mcNumber || '',
        phone: carrier.phone || '',
        address: carrier.physicalAddress || '',
        companyOfficer: carrier.companyOfficer1 || '',
      },
    }));

    // Send to mailer backend - the API handles upsert (if same id exists, it updates)
    const response = await fetch(`${MAILER_BACKEND_URL}/api/contacts`, {
      method: 'POST',
      headers: mailerAuthHeaders(),
      body: JSON.stringify(contacts),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, count: 0, error: errorData.error || `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { success: true, count: result.count || contacts.length };
  } catch (err: any) {
    console.error('Export to Equinox Mailer error:', err);
    return { success: false, count: 0, error: err.message || 'Network error' };
  }
};
