// src/services/email.service.js
const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

// --------------------------------------------------
// SMTP
// --------------------------------------------------

const isConfigured = () => {
  const { user, pass } = env.smtp;
  return Boolean(user && pass);
};

const getTransporter = () => {
  if (transporter) return transporter;

  const { host, port, user, pass } = env.smtp;

  if (!user || !pass) return null;

  const smtpHost = String(host || "");
  const smtpPort = Number(port) || 465;
  const isGmail = /gmail\.com$/i.test(smtpHost);

  transporter = nodemailer.createTransport({
    host: isGmail ? "smtp.gmail.com" : smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: { user, pass },
  });

  return transporter;
};

// --------------------------------------------------
// Safe HTML helpers
// --------------------------------------------------

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const ltr = (value) => `
  <span dir="ltr" style="
    direction:ltr;
    unicode-bidi:embed;
    display:inline-block;
    text-align:left;
  ">${escapeHtml(value)}</span>
`;

const rtlText = (value) => `
  <span dir="auto" style="
    direction:inherit;
    unicode-bidi:embed;
  ">${escapeHtml(value)}</span>
`;

const paragraph = (content, extraStyle = "") => `
  <p style="
    margin:0 0 16px;
    font-family:Arial,Tahoma,sans-serif;
    font-size:14px;
    line-height:1.9;
    color:#5F6368;
    text-align:right;
    ${extraStyle}
  ">${content}</p>
`;

// --------------------------------------------------
// Shared email layout
// --------------------------------------------------

const renderEmailLayout = ({ title, preheader, content }) => {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader || title);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${safeTitle}</title>
</head>

<body dir="rtl" style="
  margin:0;
  padding:0;
  background-color:#F1F3F4;
  font-family:Arial,Tahoma,sans-serif;
  color:#202124;
  -webkit-text-size-adjust:100%;
">

  <div style="
    display:none;
    font-size:1px;
    color:#F1F3F4;
    line-height:1px;
    max-height:0;
    max-width:0;
    opacity:0;
    overflow:hidden;
    mso-hide:all;
  ">${safePreheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellspacing="0"
    cellpadding="0" border="0" dir="rtl"
    style="width:100%;background-color:#F1F3F4;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" width="600" cellspacing="0"
          cellpadding="0" border="0" dir="rtl"
          style="
            width:100%;
            max-width:600px;
            background-color:#FFFFFF;
            border:1px solid #E0E3E7;
            border-radius:16px;
            overflow:hidden;
          ">

          <!-- Brand header -->
          <tr>
            <td align="center" style="padding:28px 20px 22px;">

              <table role="presentation" cellspacing="0"
                cellpadding="0" border="0" align="center">
                <tr>
                  <td style="padding:0 3px;">
                    <span style="display:inline-block;width:9px;height:9px;
                      background:#4285F4;border-radius:50%;"></span>
                  </td>
                  <td style="padding:0 3px;">
                    <span style="display:inline-block;width:9px;height:9px;
                      background:#EA4335;border-radius:50%;"></span>
                  </td>
                  <td style="padding:0 3px;">
                    <span style="display:inline-block;width:9px;height:9px;
                      background:#FBBC04;border-radius:50%;"></span>
                  </td>
                  <td style="padding:0 3px;">
                    <span style="display:inline-block;width:9px;height:9px;
                      background:#34A853;border-radius:50%;"></span>
                  </td>
                </tr>
              </table>

              <h1 dir="ltr" style="
                margin:12px 0 4px;
                font-family:Arial,sans-serif;
                font-size:26px;
                line-height:1.3;
                font-weight:800;
                letter-spacing:-0.5px;
                color:#202124;
              ">DevWay</h1>

              <p style="
                margin:0;
                font-family:Arial,Tahoma,sans-serif;
                font-size:12px;
                line-height:1.8;
                color:#5F6368;
              ">مجتمع المطورين والتعلم البرمجي</p>

            </td>
          </tr>

          <tr>
            <td style="height:1px;background:#E8EAED;
              font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Email content -->
          <tr>
            <td dir="rtl" style="
              padding:32px 28px;
              font-family:Arial,Tahoma,sans-serif;
              text-align:right;
              overflow-wrap:anywhere;
              word-wrap:break-word;
            ">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="
              padding:22px 20px;
              background:#F8F9FA;
              border-top:1px solid #E8EAED;
            ">
              <p style="
                margin:0 0 8px;
                font-family:Arial,Tahoma,sans-serif;
                font-size:12px;
                line-height:1.8;
                color:#5F6368;
              ">تم إرسال هذه الرسالة تلقائيًا من منصة
                <strong dir="ltr">DevWay</strong>.
              </p>

              <p style="
                margin:0;
                font-family:Arial,Tahoma,sans-serif;
                font-size:11px;
                line-height:1.8;
                color:#80868B;
              ">لو إنت مطلبتش العملية دي، تقدر تتجاهل الرسالة بأمان.
              </p>

              <p dir="ltr" style="
                margin:14px 0 0;
                font-family:Arial,sans-serif;
                font-size:11px;
                color:#9AA0A6;
              ">DevWay Platform</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
};

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

const heading = (text) => `
  <h2 style="
    margin:0 0 16px;
    font-family:Arial,Tahoma,sans-serif;
    font-size:21px;
    font-weight:700;
    line-height:1.7;
    color:#202124;
    text-align:right;
  ">${text}</h2>
`;

const codeBox = ({ label, code, hint }) => `
  <table role="presentation" width="100%" cellspacing="0"
    cellpadding="0" border="0" style="
      width:100%;
      margin:24px 0;
      background:#F1F6FE;
      border:1px solid #D2E3FC;
      border-radius:12px;
    ">
    <tr>
      <td align="center" style="padding:22px 12px;">

        <p style="
          margin:0 0 12px;
          font-family:Arial,Tahoma,sans-serif;
          font-size:12px;
          line-height:1.8;
          color:#5F6368;
        ">${label}</p>

        <div dir="ltr" style="
          font-family:Arial,sans-serif;
          font-size:32px;
          line-height:1.5;
          font-weight:800;
          letter-spacing:6px;
          color:#1A73E8;
          text-align:center;
          overflow-wrap:anywhere;
        ">${escapeHtml(code)}</div>

        <p style="
          margin:12px 0 0;
          font-family:Arial,Tahoma,sans-serif;
          font-size:12px;
          line-height:1.8;
          color:#5F6368;
        ">${hint}</p>

      </td>
    </tr>
  </table>
`;

const infoBox = (content) => `
  <table role="presentation" width="100%" cellspacing="0"
    cellpadding="0" border="0" style="
      width:100%;
      margin:20px 0;
      background:#F8F9FA;
      border:1px solid #E8EAED;
      border-radius:12px;
    ">
    <tr>
      <td dir="rtl" style="
        padding:18px;
        font-family:Arial,Tahoma,sans-serif;
        text-align:right;
      ">${content}</td>
    </tr>
  </table>
`;

// --------------------------------------------------
// Send email
// --------------------------------------------------

const sendMail = async ({ to, subject, html }) => {
  const mailClient = getTransporter();

  if (!mailClient) {
    console.error("[Email Service] SMTP credentials are not configured.");
    console.error(`[Email Service] Recipient: ${to}`);
    console.error(`[Email Service] Subject: ${subject}`);

    return {
      success: false,
      simulated: true,
      error:
        "لم يتم ضبط SMTP_USER وSMTP_PASS في إعدادات بيئة السيرفر.",
    };
  }

  try {
    const info = await mailClient.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
    });

    console.log(`[Email Sent] MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[Email Send Error]", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

// --------------------------------------------------
// Account verification
// --------------------------------------------------

const sendVerificationEmail = async ({ email, name, code }) => {
  const displayName = name
    ? `<strong>${escapeHtml(name)}</strong>`
    : "صديقنا المطور";

  const content = `
    ${heading("تأكيد حسابك على DevWay")}

    ${paragraph(`أهلًا ${displayName}،`)}

    ${paragraph(
      `شكرًا لانضمامك إلى ${ltr("DevWay")}. استخدم رمز التحقق
      التالي لتأكيد حسابك ومتابعة رحلتك على المنصة.`
    )}

    ${codeBox({
      label: `رمز التحقق · ${ltr("Verification Code")}`,
      code,
      hint: "الرمز صالح لمدة 15 دقيقة.",
    })}

    ${paragraph(
      "لأمان حسابك، لا تشارك الرمز مع أي شخص. فريق DevWay لن يطلبه منك.",
      "font-size:13px;"
    )}
  `;

  return sendMail({
    to: email,
    subject: `🔐 رمز تأكيد حسابك في DevWay: ${code}`,
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${code}`,
    },
    html: renderEmailLayout({
      title: "تأكيد الحساب | DevWay",
      preheader: `رمز التحقق الخاص بك هو ${code}`,
      content,
    }),
  });
};

// --------------------------------------------------
// Password reset
// --------------------------------------------------

const sendPasswordResetEmail = async ({ email, name, code }) => {
  const displayName = name
    ? `<strong>${escapeHtml(name)}</strong>`
    : "المطور";

  const content = `
    ${heading("إعادة تعيين كلمة المرور")}

    ${paragraph(`أهلًا ${displayName}،`)}

    ${paragraph(
      `تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك على
      ${ltr("DevWay")}. استخدم الرمز التالي لإكمال العملية.`
    )}

    ${codeBox({
      label: `رمز الاستعادة · ${ltr("Password Reset Code")}`,
      code,
      hint: "الرمز صالح لمدة 15 دقيقة.",
    })}

    ${paragraph(
      "لو إنت مطلبتش إعادة تعيين كلمة المرور، تجاهل الرسالة. كلمة مرورك الحالية لن تتغير بسبب هذا البريد وحده.",
      "font-size:13px;"
    )}
  `;

  return sendMail({
    to: email,
    subject: `🔑 رمز إعادة تعيين كلمة المرور في DevWay: ${code}`,
    headers: {
      'X-Entity-Ref-ID': `${Date.now()}-${code}`,
    },
    html: renderEmailLayout({
      title: "إعادة تعيين كلمة المرور | DevWay",
      preheader: `رمز استعادة كلمة المرور هو ${code}`,
      content,
    }),
  });
};

// --------------------------------------------------
// Assignment graded
// --------------------------------------------------

const sendAssignmentGradedEmail = async ({
  email,
  name,
  assignmentTitle,
  grade,
  maxGrade,
  feedback,
}) => {
  const numericGrade = Number(grade);
  const numericMaxGrade = Number(maxGrade);

  const validGrades =
    Number.isFinite(numericGrade) &&
    Number.isFinite(numericMaxGrade) &&
    numericMaxGrade > 0;

  const percentage = validGrades
    ? Math.round((numericGrade / numericMaxGrade) * 100)
    : null;

  const gradeColor =
    percentage === null
      ? "#202124"
      : percentage >= 80
        ? "#188038"
        : percentage >= 50
          ? "#B06000"
          : "#D93025";

  const displayName = name
    ? `<strong>${escapeHtml(name)}</strong>`
    : "طالبنا العزيز";

  const safeAssignmentTitle = escapeHtml(
    assignmentTitle || "الواجب"
  );

  const gradeDisplay = validGrades
    ? `${escapeHtml(grade)} / ${escapeHtml(maxGrade)}`
    : "لم يتم تحديد الدرجة";

  const feedbackSection = feedback
    ? `
      <tr>
        <td style="
          padding-top:16px;
          border-top:1px solid #E8EAED;
        ">
          <p style="
            margin:0 0 8px;
            font-family:Arial,Tahoma,sans-serif;
            font-size:13px;
            font-weight:700;
            line-height:1.8;
            color:#202124;
          ">ملاحظات المشرف</p>

          <div dir="auto" style="
            padding:12px;
            background:#FFFFFF;
            border:1px solid #E8EAED;
            border-radius:8px;
            font-family:Arial,Tahoma,sans-serif;
            font-size:13px;
            line-height:1.9;
            color:#3C4043;
            text-align:start;
            white-space:pre-wrap;
            overflow-wrap:anywhere;
          ">${escapeHtml(feedback)}</div>
        </td>
      </tr>
    `
    : "";

  const content = `
    ${heading("تم تقييم واجبك")}

    ${paragraph(
      `أهلًا ${displayName}، تمت مراجعة واجبك على
      ${ltr("DevWay")} وأصبحت نتيجة التقييم متاحة.`
    )}

    ${infoBox(`
      <p style="
        margin:0 0 14px;
        font-family:Arial,Tahoma,sans-serif;
        font-size:12px;
        line-height:1.8;
        color:#5F6368;
      ">تفاصيل الواجب · Assignment Details</p>

      <p dir="auto" style="
        margin:0 0 18px;
        font-family:Arial,Tahoma,sans-serif;
        font-size:16px;
        line-height:1.8;
        font-weight:700;
        color:#202124;
        text-align:start;
        overflow-wrap:anywhere;
      ">${safeAssignmentTitle}</p>

      <table role="presentation" width="100%" cellspacing="0"
        cellpadding="0" border="0">
        <tr>
          <td style="
            padding-top:14px;
            border-top:1px solid #E8EAED;
            font-family:Arial,Tahoma,sans-serif;
            font-size:13px;
            line-height:1.8;
            color:#5F6368;
            text-align:right;
          ">الدرجة المستحقة</td>

          <td dir="ltr" align="left" style="
            padding-top:14px;
            border-top:1px solid #E8EAED;
            font-family:Arial,sans-serif;
            font-size:23px;
            line-height:1.5;
            font-weight:800;
            color:${gradeColor};
            text-align:left;
            white-space:nowrap;
          ">${gradeDisplay}</td>
        </tr>

        ${
          percentage !== null
            ? `<tr>
                <td colspan="2" style="
                  padding-top:8px;
                  font-family:Arial,Tahoma,sans-serif;
                  font-size:12px;
                  line-height:1.8;
                  color:#5F6368;
                  text-align:right;
                ">النسبة المئوية:
                  <strong dir="ltr">${percentage}%</strong>
                </td>
              </tr>`
            : ""
        }

        ${feedbackSection}
      </table>
    `)}

    ${paragraph(
      "تقدر تراجع تفاصيل الواجب وملاحظات المشرف من خلال المنصة."
    )}

    <table role="presentation" cellspacing="0" cellpadding="0"
      border="0" align="center" style="margin:24px auto 0;">
      <tr>
        <td align="center" bgcolor="#1A73E8" style="
          border-radius:8px;
          background:#1A73E8;
        ">
          <a href="https://dev-way.vercel.app/assignments"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 24px;
              font-family:Arial,Tahoma,sans-serif;
              font-size:14px;
              line-height:1.5;
              font-weight:700;
              color:#FFFFFF;
              text-decoration:none;
              border-radius:8px;
            ">عرض تفاصيل الواجب</a>
        </td>
      </tr>
    </table>
  `;

  return sendMail({
    to: email,
    subject: "تم تقييم واجبك | DevWay",
    html: renderEmailLayout({
      title: "تقييم الواجب | DevWay",
      preheader: "تم تقييم واجبك. يمكنك الآن مراجعة الدرجة والملاحظات.",
      content,
    }),
  });
};

module.exports = {
  isConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAssignmentGradedEmail,
};