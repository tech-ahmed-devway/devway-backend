// src/services/email.service.js
const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { host, port, user, pass } = env.smtp;

  if (user && pass) {
    if (host.includes('gmail')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 465,
        secure: Number(port) === 465,
        auth: { user, pass }
      });
    }
  }

  return transporter;
};

/**
 * Base email layout wrapper with GDGoC DevWay identity
 */
const renderEmailLayout = ({ title, preheader, content }) => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      font-family: 'Cairo', Arial, sans-serif;
      color: #202124;
      line-height: 1.6;
      direction: rtl;
      text-align: right;
    }
    .container {
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #dadce0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header {
      padding: 28px 32px 20px;
      border-bottom: 1px solid #f1f3f4;
      text-align: center;
    }
    .dots {
      display: inline-flex;
      gap: 6px;
      margin-bottom: 12px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-blue { background-color: #4285F4; }
    .dot-red { background-color: #EA4335; }
    .dot-yellow { background-color: #FBBC04; }
    .dot-green { background-color: #34A853; }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #202124;
      margin: 0;
    }
    .brand-sub {
      font-size: 12px;
      color: #5f6368;
      margin-top: 4px;
    }
    .body {
      padding: 32px;
    }
    .code-box {
      background: #f8f9fa;
      border: 2px dashed #4285F4;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .code-text {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #1a73e8;
      direction: ltr;
      display: inline-block;
    }
    .btn {
      display: inline-block;
      background-color: #1a73e8;
      color: #ffffff !important;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      margin-top: 20px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 32px;
      border-top: 1px solid #dadce0;
      text-align: center;
      font-size: 12px;
      color: #5f6368;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="dots">
        <span class="dot dot-blue"></span>
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <h1 class="brand-title">DevWay Platform</h1>
      <p class="brand-sub">مجتمع المطورين والتعلم البرمجي</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;">هذه الرسالة تم إرسالها تلقائياً من منصة DevWay.</p>
      <p style="margin: 0; color: #80868b;">إذا لم تطلب هذه العملية، يمكنك تجاهل هذه الرسالة بأمان.</p>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Dispatch an email with live SMTP or developer console fallback
 */
const sendMail = async ({ to, subject, html }) => {
  const mailClient = getTransporter();

  if (!mailClient) {
    console.log('\n=============================================================');
    console.log('📬 [DEV EMAIL SERVICE SIMULATOR - NO SMTP CREDENTIALS SET]');
    console.log(`➡️ To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`📝 Timestamp: ${new Date().toISOString()}`);
    console.log('💡 Note: Set SMTP_USER & SMTP_PASS in backend/.env for real delivery.');
    console.log('=============================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const info = await mailClient.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html
    });
    console.log(`[Email Sent] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Send Error]:', error);
    // Don't crash the request if email delivery fails; report cleanly
    return { success: false, error: error.message };
  }
};

/**
 * Send Account Verification OTP Email
 */
const sendVerificationEmail = async ({ email, name, code }) => {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #202124;">
      مرحباً ${name || 'صديقنا المطور'} 👋
    </h2>
    <p style="font-size: 14px; color: #5f6368;">
      شكراً لانضمامك إلى منصة <strong>DevWay</strong>. لتأكيد حسابك وضمان أمان بياناتك، يرجى إدخال رمز التحقق التالي:
    </p>
    <div class="code-box">
      <div style="font-size: 11px; color: #5f6368; margin-bottom: 8px;">رمز التحقق الخاص بك (OTP)</div>
      <div class="code-text">${code}</div>
      <div style="font-size: 12px; color: #80868b; margin-top: 8px;">ينتهي خلال 15 دقيقة</div>
    </div>
    <p style="font-size: 13px; color: #5f6368;">
      لا تشارك هذا الرمز مع أي شخص. فريق DevWay لن يطلب منك هذا الرمز أبداً.
    </p>
  `;

  const html = renderEmailLayout({
    title: 'تأكيد الحساب | DevWay',
    preheader: `رمز التحقق الخاص بك في DevWay هو ${code}`,
    content
  });

  return sendMail({
    to: email,
    subject: `🔐 رمز تأكيد حسابك في DevWay: ${code}`,
    html
  });
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetEmail = async ({ email, name, code }) => {
  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #202124;">
      طلب إعادة تعيين كلمة المرور 🔑
    </h2>
    <p style="font-size: 14px; color: #5f6368;">
      مرحباً ${name || 'المطور'}، لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة <strong>DevWay</strong>.
    </p>
    <div class="code-box">
      <div style="font-size: 11px; color: #5f6368; margin-bottom: 8px;">رمز الاستعادة المؤقت</div>
      <div class="code-text">${code}</div>
      <div style="font-size: 12px; color: #80868b; margin-top: 8px;">صالح لمدة 15 دقيقة فقط</div>
    </div>
    <p style="font-size: 13px; color: #5f6368;">
      إذا لم تقم بطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد وستظل كلمة المرور الحالية آمنة.
    </p>
  `;

  const html = renderEmailLayout({
    title: 'إعادة تعيين كلمة المرور | DevWay',
    preheader: `رمز إعادة تعيين كلمة المرور هو ${code}`,
    content
  });

  return sendMail({
    to: email,
    subject: `🔑 رمز إعادة تعيين كلمة المرور في DevWay: ${code}`,
    html
  });
};

/**
 * Send Assignment Graded Notification Email
 */
const sendAssignmentGradedEmail = async ({ email, name, assignmentTitle, grade, maxGrade, feedback }) => {
  const pct = maxGrade > 0 ? Math.round((Number(grade) / Number(maxGrade)) * 100) : 0;
  const gradeColor = pct >= 80 ? '#34A853' : (pct >= 50 ? '#FBBC04' : '#EA4335');

  const content = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #202124;">
      تم تصحيح واجبك بنجاح! 📝
    </h2>
    <p style="font-size: 14px; color: #5f6368;">
      مرحباً <strong>${name || 'طالبنا العزيز'}</strong>، قام المشرف بمراجعة وتسليم تقييم واجبك:
    </p>

    <div style="background: #f8f9fa; border: 1px solid #dadce0; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 15px; font-weight: 700; color: #202124; margin-bottom: 12px;">
        📌 ${assignmentTitle}
      </div>

      <div style="display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid #e8eaed; padding-top: 14px;">
        <span style="font-size: 13px; color: #5f6368;">الدرجة المستحقة:</span>
        <span style="font-size: 24px; font-weight: 800; color: ${gradeColor}; direction: ltr;">
          ${grade} / ${maxGrade}
        </span>
      </div>

      ${feedback ? `
        <div style="margin-top: 16px; border-top: 1px solid #e8eaed; padding-top: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #5f6368; margin-bottom: 6px;">
            💬 ملاحظات وتعليقات المشرف:
          </div>
          <p style="font-size: 13px; color: #202124; margin: 0; background: #ffffff; padding: 12px; border-radius: 10px; border: 1px solid #e8eaed; line-height: 1.6;">
            ${feedback}
          </p>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dev-way.vercel.app/assignments" class="btn">
        عرض تفاصيل الواجب على المنصة ←
      </a>
    </div>
  `;

  const html = renderEmailLayout({
    title: 'تم تصحيح الواجب | DevWay',
    preheader: `تم تصحيح واجبك "${assignmentTitle}" وحصلت على ${grade}/${maxGrade}`,
    content
  });

  return sendMail({
    to: email,
    subject: `🎯 تم تصحيح واجبك: "${assignmentTitle}" (${grade}/${maxGrade})`,
    html
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAssignmentGradedEmail
};
