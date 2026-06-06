import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

// Gmail OAuth scopes requested
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly'
];

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUserObj: User | null = null;

// Initialize Google Auth Provider with Gmail scopes
const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach(scope => provider.addScope(scope));
// Prompt user to select account if appropriate
provider.setCustomParameters({
  prompt: 'select_account'
});

// Listener to clear or set authentication states
onAuthStateChanged(auth, (user) => {
  currentUserObj = user;
  if (!user) {
    cachedAccessToken = null;
  }
});

/**
 * Triggers the Google Sign-in popup to authenticate the administrator and get a Gmail API access token.
 */
export async function authenticateGmail(): Promise<{ user: User; accessToken: string }> {
  if (isSigningIn) {
    throw new Error('Autenticação em progresso. Por favor, aguarde...');
  }
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter o Token de Acesso do Google.');
    }
    cachedAccessToken = credential.accessToken;
    currentUserObj = result.user;
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Erro na autenticação do Gmail:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Retrieves the currently cached Gmail access token if alive.
 */
export function getGmailToken(): string | null {
  return cachedAccessToken;
}

/**
 * Sets the Gmail access token (for state persistence in the component lifecycle).
 */
export function setGmailToken(token: string | null) {
  cachedAccessToken = token;
}

/**
 * Revokes Google Sign-in/Logout.
 */
export async function logoutGmail(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
  currentUserObj = null;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  body: string;
}

/**
 * Lists the last messages in the user's Gmail inbox.
 */
export async function listGmailMessages(maxResults = 10): Promise<GmailMessage[]> {
  const token = getGmailToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Gmail. Por favor, conecte sua conta Google.');
  }

  // Fetch message list
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=`;
  const response = await fetch(listUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Erro ao listar mensagens do Gmail (${response.status})`);
  }

  const data = await response.json();
  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  // Fetch details for each message in parallel
  const detailsPromises = data.messages.map(async (msgSimp: { id: string }) => {
    try {
      const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSimp.id}?format=full`;
      const detailRes = await fetch(detailUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!detailRes.ok) return null;

      const detail = await detailRes.json();
      const headers = detail.payload?.headers || [];
      
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Sem Assunto)';
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
      const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
      
      // Parse fromHeader e.g., "Akson <example@test.com>"
      let senderName = fromHeader;
      let senderEmail = fromHeader;
      const emailMatch = fromHeader.match(/<([^>]+)>/);
      if (emailMatch) {
        senderEmail = emailMatch[1];
        senderName = fromHeader.replace(emailMatch[0], '').trim();
      }

      // Extract body
      let body = '';
      if (detail.payload?.parts) {
        const textParts = detail.payload.parts.filter((p: any) => p.mimeType === 'text/plain' || p.mimeType === 'text/html');
        if (textParts.length > 0) {
          // Use standard base64 decoding safely
          const base64Data = (textParts[0].body?.data || '')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          try {
            body = decodeURIComponent(escape(window.atob(base64Data)));
          } catch {
            body = window.atob(base64Data);
          }
        }
      } else if (detail.payload?.body?.data) {
        const base64Data = detail.payload.body.data
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        try {
          body = decodeURIComponent(escape(window.atob(base64Data)));
        } catch {
          body = window.atob(base64Data);
        }
      }

      if (!body) {
        body = detail.snippet || '';
      }

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet || '',
        senderName: senderName || 'Desconhecido',
        senderEmail: senderEmail || 'desconhecido@gmail.com',
        subject: subject,
        date: date,
        body: body,
      };
    } catch (e) {
      console.warn(`Error resolving Gmail message details of ID ${msgSimp.id}`, e);
      return null;
    }
  });

  const rawResults = await Promise.all(detailsPromises);
  return rawResults.filter((r): r is GmailMessage => r !== null);
}

/**
 * Sends an email using the authorized Gmail account.
 */
export async function sendGmailMessage(to: string, subject: string, htmlMessage: string): Promise<{ id: string }> {
  const token = getGmailToken();
  if (!token) {
    throw new Error('Usuário não autenticado no Gmail. Conecte no painel primeiro.');
  }

  // RFC 2822 compliant formatted raw email structure with Unicode support
  const utf8Subject = `=?utf-8?B?${window.btoa(unescape(encodeURIComponent(subject)))}?=`;
  const rawEmailContent = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlMessage
  ].join('\r\n');

  // Safely URL-safe Base64 encode for Google API
  const base64EncodedEmail = window.btoa(unescape(encodeURIComponent(rawEmailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedEmail,
    }),
  });

  if (!sendResponse.ok) {
    const errorJson = await sendResponse.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Erro ao enviar e-mail via Gmail (${sendResponse.status})`);
  }

  return await sendResponse.json();
}
