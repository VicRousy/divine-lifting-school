const API_URL = 'http://localhost:3001';

export async function sendWelcomeEmail(userEmail, uniqueId, password, accountType) {
  try {
    const response = await fetch(`${API_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, uniqueId, password, accountType }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Email sending failed');

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}