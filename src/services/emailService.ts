import { API_URL } from '../config/api';
import { supabase } from '../supabaseClient'

interface EmailResult {
  success: boolean;
  error?: string;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function emailRequest(payload: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Email sending failed')
  return data
}

export async function sendWelcomeEmail(
  userEmail: string,
  uniqueId: string,
  password: string,
  accountType: string,
  parentName: string | null = null,
  studentName: string | null = null,
): Promise<EmailResult> {
  try {
    await emailRequest({ type: 'welcome', userEmail, uniqueId, password, accountType, parentName, studentName })

    return { success: true };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendVerificationEmail(userEmail: string, code: string, loginId: string): Promise<EmailResult> {
  try {
    await emailRequest({ type: 'verification', userEmail, code, loginId })

    return { success: true };
  } catch (error: any) {
    console.error('Verification email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAnnouncementEmail(recipients: string[], title: string, body: string, audience: string): Promise<EmailResult> {
  try {
    await emailRequest({ type: 'announcement', recipients, title, body, audience })

    return { success: true };
  } catch (error: any) {
    console.error('Announcement email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendFeeInvoice(recipient: string, studentName: string, feeType: string, amount: number, dueDate: string): Promise<EmailResult> {
  try {
    await emailRequest({ type: 'fee-invoice', recipient, studentName, feeType, amount, dueDate })

    return { success: true };
  } catch (error: any) {
    console.error('Fee invoice error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApplicationDecision(recipient: string, studentName: string, applicationNumber: string, decision: string, className: string): Promise<EmailResult> {
  try {
    await emailRequest({ type: 'application-decision', recipient, studentName, applicationNumber, decision, className })

    return { success: true };
  } catch (error: any) {
    console.error('Application decision email error:', error);
    return { success: false, error: error.message };
  }
}
