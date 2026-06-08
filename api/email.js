import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.body;

  try {
    switch (type) {
      case 'welcome':
        return await sendWelcome(req, res);
      case 'verification':
        return await sendVerification(req, res);
      case 'announcement':
        return await sendAnnouncement(req, res);
      case 'fee-invoice':
        return await sendFeeInvoice(req, res);
      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }
  } catch (error) {
    console.error(`Email error [${type}]:`, error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function sendWelcome(req, res) {
  const { userEmail, uniqueId, password, accountType, parentName, studentName } = req.body;
  if (!userEmail || !uniqueId || !password || !accountType) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  let accountTypeText, detailsHtml;
  if (accountType === 'parent') {
    accountTypeText = 'Parent';
    detailsHtml = `
      ${parentName ? `<div class="credential-row"><span class="label">Parent Name:</span><span class="value">${parentName}</span></div>` : ''}
      <div class="credential-row"><span class="label">Login ID:</span><span class="value">${uniqueId}</span></div>
      <div class="credential-row"><span class="label">Password:</span><span class="value">${password}</span></div>
      ${studentName ? `<div class="credential-row"><span class="label">Linked Student:</span><span class="value">${studentName}</span></div>` : ''}
    `;
  } else {
    accountTypeText = accountType === 'admin' ? 'Administrator' : accountType === 'teacher' ? 'Teacher' : 'Student';
    detailsHtml = `
      <div class="credential-row"><span class="label">Login ID:</span><span class="value">${uniqueId}</span></div>
      <div class="credential-row"><span class="label">Password:</span><span class="value">${password}</span></div>
    `;
  }

  const info = await transporter.sendMail({
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: `Welcome to Divine Lifting School - Your ${accountTypeText} Credentials`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
      .container{max-width:600px;margin:0 auto}
      .header{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;padding:40px 30px;text-align:center;border-radius:10px 10px 0 0}
      .header h1{margin:0;font-size:28px}
      .content{background:#f9fafb;padding:40px 30px;border-radius:0 0 10px 10px}
      .credentials{background:#fff;padding:25px;margin:25px 0;border-left:4px solid #38bdf8;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.1)}
      .credential-row{margin:15px 0}
      .label{font-weight:700;color:#64748b;font-size:14px;display:block;margin-bottom:5px}
      .value{color:#0f172a;font-size:18px;font-family:'Courier New',monospace;background:#f1f5f9;padding:10px 15px;border-radius:6px;display:inline-block;font-weight:600;letter-spacing:1px}
      .warning{background:#fef3c7;border-left:4px solid #f59e0b;padding:15px 20px;margin:25px 0;border-radius:4px}
      .footer{text-align:center;color:#94a3b8;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0}
    </style></head><body>
      <div class="container">
        <div class="header"><h1>Divine Lifting School</h1><p>Academic Management Portal</p></div>
        <div class="content">
          <h2>Account Created Successfully!</h2>
          <p>Your <strong>${accountTypeText}</strong> account has been created. Below are your login credentials:</p>
          <div class="credentials">${detailsHtml}</div>
          <div class="warning"><strong>Important Security Notice:</strong><br>Please keep these credentials confidential. We strongly recommend changing your password after your first login.</div>
          <div class="footer"><p><strong>Divine Lifting School</strong></p><p>Ikorodu, Lagos, Nigeria</p></div>
        </div>
      </div>
    </body></html>`,
  });

  console.log(`Welcome email sent to: ${userEmail}`);
  res.json({ success: true, messageId: info.messageId });
}

async function sendVerification(req, res) {
  const { userEmail, code, loginId } = req.body;
  if (!userEmail || !code || !loginId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const info = await transporter.sendMail({
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: userEmail,
    subject: 'Verify Your Admin Account - Divine Lifting School',
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f9fafb}
      .container{max-width:600px;margin:0 auto}
      .header{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;padding:40px 30px;text-align:center;border-radius:10px 10px 0 0}
      .header h1{margin:0;font-size:28px}
      .content{background:#fff;padding:40px 30px;border-radius:0 0 10px 10px;text-align:center}
      .code-box{background:#f1f5f9;padding:20px;margin:25px 0;border-radius:8px;font-size:32px;font-family:'Courier New',monospace;font-weight:700;letter-spacing:8px;color:#0f172a;border:2px dashed #38bdf8}
      .info{color:#64748b;font-size:14px;margin:15px 0}
      .footer{text-align:center;color:#94a3b8;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0}
    </style></head><body>
      <div class="container">
        <div class="header"><h1>Divine Lifting School</h1></div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Enter this 6-digit code to activate your admin account:</p>
          <div class="code-box">${code}</div>
          <p class="info"><strong>Login ID:</strong> ${loginId}</p>
          <p class="info">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
          <div class="footer"><p><strong>Divine Lifting School</strong></p><p>Ikorodu, Lagos, Nigeria</p></div>
        </div>
      </div>
    </body></html>`,
  });

  console.log(`Verification email sent to: ${userEmail}`);
  res.json({ success: true, messageId: info.messageId });
}

async function sendAnnouncement(req, res) {
  const { recipients, title, body, audience } = req.body;
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing recipients' });
  }
  if (!title || !body) {
    return res.status(400).json({ success: false, error: 'Missing title or body' });
  }

  const info = await transporter.sendMail({
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: recipients.join(', '),
    subject: `New Announcement: ${title}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f9fafb}
      .container{max-width:600px;margin:0 auto}
      .header{background:linear-gradient(135deg,#a855f7,#38bdf8);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .header h1{margin:0;font-size:24px}
      .content{background:#fff;padding:30px;border-radius:0 0 10px 10px}
      .message{background:#f1f5f9;padding:20px;margin:20px 0;border-radius:8px;white-space:pre-wrap}
      .badge{display:inline-block;padding:4px 12px;background:#e0e7ff;color:#4338ca;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:15px}
      .footer{text-align:center;color:#94a3b8;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0}
    </style></head><body>
      <div class="container">
        <div class="header"><h1>Divine Lifting School</h1><p>New Announcement</p></div>
        <div class="content">
          <span class="badge">For: ${audience}</span>
          <h2>${title}</h2>
          <div class="message">${body}</div>
          <div class="footer"><p><strong>Divine Lifting School</strong></p><p>Ikorodu, Lagos, Nigeria</p></div>
        </div>
      </div>
    </body></html>`,
  });

  console.log(`Announcement email sent to ${recipients.length} recipients`);
  res.json({ success: true, messageId: info.messageId });
}

async function sendFeeInvoice(req, res) {
  const { recipient, studentName, feeType, amount, dueDate } = req.body;
  if (!recipient || !studentName || !amount || !dueDate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const info = await transporter.sendMail({
    from: `Divine Lifting School <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: `Fee Invoice: ${feeType || 'School Fees'} for ${studentName}`,
    html: `<!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f9fafb}
      .container{max-width:600px;margin:0 auto}
      .header{background:linear-gradient(135deg,#10b981,#38bdf8);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .header h1{margin:0;font-size:24px}
      .content{background:#fff;padding:30px;border-radius:0 0 10px 10px}
      .invoice-box{background:#f1f5f9;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #10b981}
      .row{display:flex;justify-content:space-between;margin:10px 0}
      .label{font-weight:700;color:#64748b}
      .value{color:#0f172a;font-weight:600}
      .amount{font-size:24px;color:#10b981;font-weight:700;text-align:center;margin:20px 0}
      .due-date{background:#fef3c7;padding:10px;border-radius:6px;text-align:center;color:#92400e;font-weight:700}
      .footer{text-align:center;color:#94a3b8;font-size:14px;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0}
    </style></head><body>
      <div class="container">
        <div class="header"><h1>Divine Lifting School</h1><p>Fee Invoice</p></div>
        <div class="content">
          <p>Dear Parent/Guardian,</p>
          <p>This is an invoice for <strong>${studentName}</strong>.</p>
          <div class="invoice-box">
            <div class="row"><span class="label">Fee Type:</span><span class="value">${feeType || 'School Fees'}</span></div>
            <div class="row"><span class="label">Student:</span><span class="value">${studentName}</span></div>
            <div class="amount">₦${Number(amount).toLocaleString()}</div>
            <div class="due-date">Due Date: ${new Date(dueDate).toLocaleDateString()}</div>
          </div>
          <p>Please ensure payment is made before the due date.</p>
          <div class="footer"><p><strong>Divine Lifting School</strong></p><p>Ikorodu, Lagos, Nigeria</p></div>
        </div>
      </div>
    </body></html>`,
  });

  console.log(`Fee invoice sent to: ${recipient}`);
  res.json({ success: true, messageId: info.messageId });
}
