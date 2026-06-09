import { API_URL } from '../config/api';

export async function sendWelcomeEmail(userEmail, uniqueId, password, accountType, parentName = null, studentName = null) {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'welcome', userEmail, uniqueId, password, accountType, parentName, studentName }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Email sending failed');

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendVerificationEmail(userEmail, code, loginId) {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'verification', userEmail, code, loginId }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Verification email failed');

    return { success: true };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAnnouncementEmail(recipients, title, body, audience) {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'announcement', recipients, title, body, audience }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Announcement email failed');

    return { success: true };
  } catch (error) {
    console.error('Announcement email error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendFeeInvoice(recipient, studentName, feeType, amount, dueDate) {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'fee-invoice', recipient, studentName, feeType, amount, dueDate }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Fee invoice email failed');

    return { success: true };
  } catch (error) {
    console.error('Fee invoice error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApplicationDecision(recipient, studentName, applicationNumber, decision, className) {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'application-decision', recipient, studentName, applicationNumber, decision, className }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Application decision email failed');

    return { success: true };
  } catch (error) {
    console.error('Application decision email error:', error);
    return { success: false, error: error.message };
  }
}
