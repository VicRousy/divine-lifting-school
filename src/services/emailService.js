import { API_URL } from '../config/api';

const EMAIL_API_KEY = import.meta.env.VITE_EMAIL_API_KEY

async function apiFetch(body) {
  const response = await fetch(`${API_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': EMAIL_API_KEY },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Email request failed')
  return data
}

export async function sendWelcomeEmail(userEmail, uniqueId, password, accountType, parentName = null, studentName = null) {
  try {
    await apiFetch({ type: 'welcome', userEmail, uniqueId, password, accountType, parentName, studentName })
    return { success: true }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendVerificationEmail(userEmail, code, loginId) {
  try {
    await apiFetch({ type: 'verification', userEmail, code, loginId })
    return { success: true }
  } catch (error) {
    console.error('Verification email error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendAnnouncementEmail(recipients, title, body, audience) {
  try {
    await apiFetch({ type: 'announcement', recipients, title, body, audience })
    return { success: true }
  } catch (error) {
    console.error('Announcement email error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendFeeInvoice(recipient, studentName, feeType, amount, dueDate) {
  try {
    await apiFetch({ type: 'fee-invoice', recipient, studentName, feeType, amount, dueDate })
    return { success: true }
  } catch (error) {
    console.error('Fee invoice error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendApplicationDecision(recipient, studentName, applicationNumber, decision, className) {
  try {
    await apiFetch({ type: 'application-decision', recipient, studentName, applicationNumber, decision, className })
    return { success: true }
  } catch (error) {
    console.error('Application decision email error:', error)
    return { success: false, error: error.message }
  }
}
