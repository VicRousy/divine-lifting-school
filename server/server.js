import 'dotenv/config'
import express from 'express';
import nodemailer from 'nodemailer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
}

const ALLOWED_ORIGINS = [
  'https://divine-lifting-school.vercel.app',
  'https://divine-lifting-website.vercel.app',
  'http://localhost:5173',
  'http://localhost:3001',
]

const RATE_LIMIT = {}
const RATE_WINDOW = 60000
const MAX_PER_WINDOW = 20

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Origin validation
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || ''
  if (origin && !ALLOWED_ORIGINS.some(a => origin.startsWith(a) && origin.length === a.length)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
})

// Rate limiting
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  if (RATE_LIMIT[ip] && RATE_LIMIT[ip].length >= MAX_PER_WINDOW && RATE_LIMIT[ip][0] > now - RATE_WINDOW) {
    return res.status(429).json({ error: 'Too many requests' })
  }
  if (!RATE_LIMIT[ip]) RATE_LIMIT[ip] = []
  RATE_LIMIT[ip].push(now)
  RATE_LIMIT[ip] = RATE_LIMIT[ip].filter(t => t > now - RATE_WINDOW)
  next()
})

// API key check for email endpoints
app.use('/api/email', (req, res, next) => {
  const key = req.headers['x-api-key']
  if (!key || key !== process.env.EMAIL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Unified email endpoint (mirrors Vercel serverless function at api/email.js)
app.post('/api/email', async (req, res) => {
  const { type } = req.body;
  const routes = {
    welcome: '/api/send-welcome-email',
    verification: '/api/send-verification-email',
    announcement: '/api/send-announcement-email',
    'fee-invoice': '/api/send-fee-invoice',
    'application-decision': '/api/send-application-decision',
  };
  const target = routes[type];
  if (!target) return res.status(400).json({ error: 'Invalid email type' });
  req.url = target;
  app(req, res);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    gmailConfigured: !!process.env.GMAIL_USER
  });
});

// Send welcome email endpoint
app.post('/api/send-welcome-email', async (req, res) => {
  const { userEmail, uniqueId, password, accountType, parentName, studentName } = req.body;

  // Validation
  if (!userEmail || !uniqueId || !password || !accountType) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
    });
  }

  let accountTypeText = '';
  let detailsHtml = '';

  if (accountType === 'parent') {
    accountTypeText = 'Parent';
    detailsHtml = `
      <div class="credentials">
        ${parentName ? `<div class="credential-row"><span class="label">Parent Name:</span><span class="value">${esc(parentName)}</span></div>` : ''}
        <div class="credential-row"><span class="label">Login ID:</span><span class="value">${esc(uniqueId)}</span></div>
        <div class="credential-row"><span class="label">Password:</span><span class="value">${esc(password)}</span></div>
        ${studentName ? `<div class="credential-row"><span class="label">Linked Student:</span><span class="value">${esc(studentName)}</span></div>` : ''}
      </div>
    `;
  } else {
    accountTypeText = accountType === 'admin' ? 'Administrator' : accountType === 'teacher' ? 'Teacher' : 'Student';
    detailsHtml = `
      <div class="credentials">
        <div class="credential-row"><span class="label">Login ID:</span><span class="value">${esc(uniqueId)}</span></div>
        <div class="credential-row"><span class="label">Password:</span><span class="value">${esc(password)}</span></div>
      </div>
    `;
  }

  const mailOptions = {
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `Welcome to Divine Lifting School - Your ${esc(accountTypeText)} Credentials`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; }
        .content h2 { color: #0f172a; margin-top: 0; }
        .credentials { background: white; padding: 25px; margin: 25px 0; border-left: 4px solid #38bdf8; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .credential-row { margin: 15px 0; }
        .label { font-weight: bold; color: #64748b; font-size: 14px; display: block; margin-bottom: 5px; }
        .value { color: #0f172a; font-size: 18px; font-family: 'Courier New', monospace; background: #f1f5f9; padding: 10px 15px; border-radius: 6px; display: inline-block; font-weight: 600; letter-spacing: 1px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .warning strong { color: #92400e; }
        .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Divine Lifting School</h1>
          <p>Academic Management Portal</p>
        </div>
        
        <div class="content">
          <h2>Account Created Successfully!</h2>
          
          <p>Your <strong>${esc(accountTypeText)}</strong> account has been created. Below are your login credentials:</p>
          
          ${detailsHtml}
          
          <div class="warning">
            <strong>Important Security Notice:</strong><br>
            Please keep these credentials confidential. We strongly recommend changing your password after your first login.
          </div>
          
          <div class="footer">
            <p><strong>Divine Lifting School</strong></p>
            <p>Ikorodu, Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${userEmail}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send verification email endpoint
app.post('/api/send-verification-email', async (req, res) => {
  const { userEmail, code, loginId } = req.body;

  if (!userEmail || !code || !loginId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const mailOptions = {
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: 'Verify Your Admin Account - Divine Lifting School',
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; text-align: center; }
        .code-box { background: #f1f5f9; padding: 20px; margin: 25px 0; border-radius: 8px; font-size: 32px; font-family: 'Courier New', monospace; font-weight: bold; letter-spacing: 8px; color: #0f172a; border: 2px dashed #38bdf8; }
        .info { color: #64748b; font-size: 14px; margin: 15px 0; }
        .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Divine Lifting School</h1>
        </div>
        <div class="content">
          <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
          <p style="color: #64748b;">Enter this 6-digit code to activate your admin account:</p>
          <div class="code-box">${esc(code)}</div>
          <p class="info"><strong>Login ID:</strong> ${esc(loginId)}</p>
          <p class="info">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p><strong>Divine Lifting School</strong></p>
            <p>Ikorodu, Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${userEmail}`);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ Verification email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send announcement email endpoint
app.post('/api/send-announcement-email', async (req, res) => {
  const { recipients, title, body, audience } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing recipients' });
  }
  if (!title || !body) {
    return res.status(400).json({ success: false, error: 'Missing title or body' });
  }

  const mailOptions = {
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: recipients.join(', '),
    subject: `New Announcement: ${esc(title)}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .content h2 { color: #0f172a; margin-top: 0; }
        .message { background: #f1f5f9; padding: 20px; margin: 20px 0; border-radius: 8px; white-space: pre-wrap; }
        .audience-badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
        .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Divine Lifting School</h1>
          <p>New Announcement</p>
        </div>
        <div class="content">
          <span class="audience-badge">For: ${esc(audience)}</span>
          <h2>${esc(title)}</h2>
          <div class="message">${esc(body)}</div>
          <div class="footer">
            <p><strong>Divine Lifting School</strong></p>
            <p>Ikorodu, Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Announcement email sent to ${recipients.length} recipients`);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ Announcement email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send fee invoice email endpoint
app.post('/api/send-fee-invoice', async (req, res) => {
  const { recipient, studentName, feeType, amount, dueDate } = req.body;

  if (!recipient || !studentName || !amount || !dueDate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const mailOptions = {
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: `Fee Invoice: ${esc(feeType)} for ${esc(studentName)}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #10b981 0%, #38bdf8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .invoice-box { background: #f1f5f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
        .invoice-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .invoice-label { font-weight: bold; color: #64748b; }
        .invoice-value { color: #0f172a; font-weight: 600; }
        .amount { font-size: 24px; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
        .due-date { background: #fef3c7; padding: 10px; border-radius: 6px; text-align: center; color: #92400e; font-weight: bold; }
        .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Divine Lifting School</h1>
          <p>Fee Invoice</p>
        </div>
        <div class="content">
          <p>Dear Parent/Guardian,</p>
          <p>This is an invoice for <strong>${esc(studentName)}</strong>.</p>
          
          <div class="invoice-box">
            <div class="invoice-row">
              <span class="invoice-label">Fee Type:</span>
              <span class="invoice-value">${esc(feeType)}</span>
            </div>
            <div class="invoice-row">
              <span class="invoice-label">Student:</span>
              <span class="invoice-value">${esc(studentName)}</span>
            </div>
            <div class="amount">₦${Number(amount).toLocaleString()}</div>
            <div class="due-date">Due Date: ${new Date(dueDate).toLocaleDateString()}</div>
          </div>
          
          <p>Please ensure payment is made before the due date to avoid any inconvenience.</p>
          
          <div class="footer">
            <p><strong>Divine Lifting School</strong></p>
            <p>Ikorodu, Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Fee invoice sent to: ${recipient}`);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ Fee invoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send application decision email endpoint
app.post('/api/send-application-decision', async (req, res) => {
  const { recipient, studentName, applicationNumber, decision, className } = req.body;

  if (!recipient || !studentName || !applicationNumber || !decision) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const isAccepted = decision === 'accepted';
  const schoolEmail = process.env.GMAIL_USER || 'info@divineliftingschool.com';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const subject = isAccepted
    ? `Admission Accepted - ${esc(studentName)} - Divine Lifting School`
    : `Application Update - ${esc(studentName)} - Divine Lifting School`;

  const bodyContent = isAccepted ? `
    <p>We are pleased to inform you that <strong>${esc(studentName)}</strong> has been <span style="color:#10b981;font-weight:700;">accepted</span> into <strong>${esc(className || 'our school')}</strong> at <strong>Divine Lifting International School</strong>.</p>
    <p>Application Number: <strong>${esc(applicationNumber)}</strong></p>
    <div class="info-box">
      <p style="margin:0;font-weight:700;color:#1e293b;">Next Steps:</p>
      <ol style="margin:8px 0 0;padding-left:20px;color:#475569;">
        <li>Visit the school office with your child's documents for verification.</li>
        <li>Complete the enrollment registration at the administration block.</li>
        <li>Pay the required fees and obtain the official acceptance letter.</li>
        <li>Collect the school uniform and supply list.</li>
      </ol>
    </div>
    <p>For any questions regarding the admission process, please contact the school office.</p>
  ` : `
    <p>Thank you for your interest in <strong>Divine Lifting International School</strong>.</p>
    <p>After careful review of the application for <strong>${esc(studentName)}</strong> (Application #${esc(applicationNumber)}) for <strong>${esc(className || 'admission')}</strong>, we regret to inform you that your application has <span style="color:#ef4444;font-weight:700;">not been successful</span> at this time.</p>
    <p>We appreciate the time you took to apply and encourage you to consider applying again in the future.</p>
  `;

  const mailOptions = {
    from: `Divine Lifting International School <${esc(schoolEmail)}>`,
    to: recipient,
    subject,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f9fafb}
      .container{max-width:600px;margin:0 auto}
      .header{background:${isAccepted ? 'linear-gradient(135deg,#10b981,#38bdf8)' : 'linear-gradient(135deg,#64748b,#94a3b8)'};color:#fff;padding:32px 30px;text-align:center;border-radius:10px 10px 0 0}
      .header h1{margin:0;font-size:22px}
      .header p{margin:6px 0 0;font-size:14px;opacity:0.9}
      .content{background:#fff;padding:30px;border-radius:0 0 10px 10px}
      .info-box{background:#f1f5f9;padding:16px 20px;margin:16px 0;border-radius:8px;border-left:4px solid ${isAccepted ? '#10b981' : '#94a3b8'}}
      .stamp{text-align:center;margin:24px 0 8px;font-size:13px;color:#64748b}
      .footer{text-align:center;color:#94a3b8;font-size:13px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}
    </style></head><body>
      <div class="container">
        <div class="header">
          <h1>Divine Lifting International School</h1>
          <p>${isAccepted ? 'Admission Accepted' : 'Application Decision'}</p>
        </div>
        <div class="content">
          <p style="color:#64748b;font-size:13px;">Date: ${esc(date)}</p>
          <p>Dear Parent/Guardian,</p>
          ${bodyContent}
          <p>Yours sincerely,</p>
          <p style="font-weight:700;margin:0;">The Admissions Office</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Divine Lifting International School</p>
          <div class="stamp">━━━ Official Notice ━━━</div>
          <div class="footer">
            <p style="margin:0 0 4px;"><strong>Divine Lifting International School</strong></p>
            <p style="margin:0 0 2px;">Ikorodu, Lagos, Nigeria</p>
            <p style="margin:0;">Email: ${esc(schoolEmail)}</p>
          </div>
        </div>
      </div>
    </body></html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ AUTH ENDPOINTS ============

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
const authSupabase = supabaseUrl && serviceKey ? createSupabaseClient(supabaseUrl, serviceKey) : null

app.post('/api/auth', async (req, res) => {
  const { type } = req.body
  try {
    switch (type) {
      case 'create-user': return await createAuthUser(req, res)
      case 'reset-password': return await resetAuthPassword(req, res)
      default: return res.status(400).json({ error: 'Invalid auth type' })
    }
  } catch (error) {
    console.error(`Auth error [${type}]:`, error)
    return res.status(500).json({ success: false, error: error.message })
  }
})

async function createAuthUser(req, res) {
  if (!authSupabase) return res.status(500).json({ success: false, error: 'Auth not configured' })
  const { email, password, userData } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' })
  }
  const { data, error } = await authSupabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: userData || {},
  })
  if (error) {
    if (error.message.includes('already been registered')) {
      return res.json({ success: true, auth_id: null, alreadyExists: true })
    }
    return res.status(400).json({ success: false, error: error.message })
  }
  return res.json({ success: true, auth_id: data.user.id })
}

async function resetAuthPassword(req, res) {
  if (!authSupabase) return res.status(500).json({ success: false, error: 'Auth not configured' })
  const { email, newPassword, userId } = req.body
  if (!newPassword) return res.status(400).json({ success: false, error: 'Missing password' })
  let targetId = userId
  if (!targetId) {
    const { data: users, error } = await authSupabase.auth.admin.listUsers()
    if (error) return res.status(400).json({ success: false, error: error.message })
    const user = users.users.find(u => u.email === email?.trim()?.toLowerCase())
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    targetId = user.id
  }
  const { error } = await authSupabase.auth.admin.updateUserById(targetId, { password: newPassword })
  if (error) return res.status(400).json({ success: false, error: error.message })
  return res.json({ success: true })
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail: ${process.env.GMAIL_USER || 'NOT CONFIGURED'}`);
  console.log(`✅ Ready to send emails!\n`);
});
