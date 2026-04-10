// SimpleFin Bridge API client
// Docs: https://www.simplefin.org/protocol.html

export interface SimpleFinOrg {
  domain?: string;
  name?: string;
  url?: string;
  'sfin-url'?: string;
}

export interface SimpleFinAccount {
  id: string;
  name: string;
  currency: string;
  balance: string; // decimal string, e.g. "1234.56"
  'available-balance'?: string;
  'balance-date': number; // Unix timestamp
  transactions: SimpleFinTransaction[];
  org?: SimpleFinOrg;
  extra?: Record<string, unknown>;
}

export interface SimpleFinTransaction {
  id: string;
  posted: number; // Unix timestamp
  amount: string;
  description: string;
}

interface SimpleFinResponse {
  errors?: string[];
  accounts: SimpleFinAccount[];
}

/**
 * Exchange a SimpleFin setup token for a permanent access URL.
 * The setup token is a base64-encoded claim URL (one-time use).
 */
export async function claimAccessUrl(setupToken: string): Promise<string> {
  let claimUrl: string;
  try {
    claimUrl = atob(setupToken.trim());
  } catch {
    throw new Error('Invalid setup token — make sure you copied it exactly from SimpleFin.');
  }

  if (!claimUrl.startsWith('http')) {
    throw new Error('Setup token did not decode to a valid URL.');
  }

  const res = await fetch(claimUrl, {
    method: 'POST',
    headers: { 'Content-Length': '0' },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SimpleFin claim failed (${res.status})${body ? ': ' + body : ''}`);
  }

  const accessUrl = (await res.text()).trim();

  if (!accessUrl.startsWith('http')) {
    throw new Error('Unexpected response from SimpleFin. Try generating a fresh setup token.');
  }

  return accessUrl;
}

/**
 * Fetch live account balances from SimpleFin using a stored access URL.
 * Credentials are extracted from the URL and sent as Basic auth headers
 * so the raw URL is never exposed in network requests.
 */
export async function fetchSimpleFinAccounts(accessUrl: string): Promise<SimpleFinAccount[]> {
  let url: URL;
  try {
    url = new URL(accessUrl);
  } catch {
    throw new Error('Stored SimpleFin access URL is malformed. Try reconnecting.');
  }

  const credentials = btoa(
    `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`
  );
  const apiUrl = `${url.protocol}//${url.host}${url.pathname}/accounts`;

  const res = await fetch(apiUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('SimpleFin access denied — your token may have expired. Please reconnect.');
  }
  if (!res.ok) {
    throw new Error(`SimpleFin returned ${res.status}. Please try again.`);
  }

  const data: SimpleFinResponse = await res.json();

  if (data.errors?.length) {
    throw new Error(`SimpleFin: ${data.errors.join(', ')}`);
  }

  return data.accounts ?? [];
}
