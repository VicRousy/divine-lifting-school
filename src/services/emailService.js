import { API_URL } from '../config/api';

export async function sendWelcomeEmail(userEmail, uniqueId, password, accountType, parentName = null, studentName = null) {
  try {
    const response = await fetch(`${API_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, uniqueId, password, accountType, parentName, studentName }),
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
    const response = await fetch(`${API_URL}/api/send-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, code, loginId }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Verification email failed');

    return { success: true };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false, error: error.message };
  }
}
