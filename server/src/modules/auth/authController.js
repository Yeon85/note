import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { runQuery } from '../../config/db.js';
import { createRandomToken, sha256 } from '../../utils/crypto.js';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.smtpFrom) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: false,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
  });
}

function formatTtl(ttlMinutes) {
  const minutes = Number(ttlMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return '잠시 후';
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours}시간`;
  }
  return `${minutes}분`;
}

function buildPasswordResetEmail({ resetUrl, ttlMinutes }) {
  const brand = 'SHELL-NOTE';
  const ttlText = `${formatTtl(ttlMinutes)} 후에 만료됩니다.`;
  const subject = `${brand} 비밀번호 재설정`;

  const text = [
    '비밀번호 재설정 요청',
    '',
    '비밀번호 재설정을 요청하셨습니다. 아래 링크를 열어 새 비밀번호를 설정하세요.',
    resetUrl,
    '',
    `이 링크는 ${ttlText}`,
    '',
    '만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.',
  ].join('\n');

  // Email-client friendly: table + inline styles
  const html = `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f7fb;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(180deg,#f8f6ff,#f5fbff);padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(31,41,55,0.10);box-shadow:0 10px 28px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:22px 24px;background:linear-gradient(90deg,rgba(124,108,242,0.95),rgba(245,167,214,0.85));color:#fff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                <div style="font-size:20px;font-weight:800;letter-spacing:-0.02em;">${brand}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 10px 24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
                <div style="font-size:18px;font-weight:800;margin:0 0 8px 0;">비밀번호 재설정 요청</div>
                <div style="font-size:14px;line-height:1.6;color:rgba(31,41,55,0.75);margin:0 0 18px 0;">
                  비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
                </div>
                <div style="padding:14px 0 18px 0;">
                  <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:linear-gradient(90deg, rgba(92, 71, 245, 1), rgba(240, 90, 170, 1));box-shadow:0 10px 22px rgba(92, 71, 245, 0.18);color:#fff;text-decoration:none;font-weight:800;letter-spacing:-0.01em;">
                    비밀번호 재설정
                  </a>
                </div>
                <div style="font-size:13px;line-height:1.6;color:rgba(31,41,55,0.70);margin:0 0 12px 0;">
                  만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.
                </div>
                <hr style="border:none;border-top:1px solid rgba(31,41,55,0.10);margin:18px 0;" />
                <div style="font-size:12px;line-height:1.6;color:rgba(31,41,55,0.60);margin:0 0 6px 0;">
                  이 링크는 ${ttlText}
                </div>
                <div style="font-size:12px;line-height:1.6;color:rgba(31,41,55,0.60);margin:0 0 8px 0;">
                  버튼이 동작하지 않는 경우, 아래 URL을 복사하여 브라우저에 붙여넣으세요.
                </div>
                <div style="font-size:12px;line-height:1.6;word-break:break-all;background:rgba(92, 71, 245, 0.06);border:1px solid rgba(92, 71, 245, 0.14);padding:10px 12px;border-radius:12px;">
                  <a href="${resetUrl}" style="color:rgba(92, 71, 245, 0.98);text-decoration:underline;">${resetUrl}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 22px 24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:rgba(31,41,55,0.55);font-size:12px;">
                이 메일은 발신 전용입니다.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

  return { subject, text, html };
}

export async function register(req, res, next) {
  try {
    const { email, password, name, agreePrivacy, agreeTerms, agreeMarketing } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: '이름, 이메일, 비밀번호(6자 이상)를 입력해 주세요.' });
    }

    const existingUsers = await runQuery(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { email },
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }

    const agreePrivacyYn = agreePrivacy ? 'Y' : 'N';
    const agreeTermsYn = agreeTerms ? 'Y' : 'N';
    const agreeMarketingYn = agreeMarketing ? 'Y' : 'N';

    const passwordHash = await bcrypt.hash(password, 12);
    let result;
    try {
      result = await runQuery(
        `INSERT INTO users (name, email, password_hash, agree_privacy, agree_terms, agree_marketing)
         VALUES (:name, :email, :passwordHash, :agreePrivacy, :agreeTerms, :agreeMarketing)`,
        {
          name,
          email,
          passwordHash,
          agreePrivacy: agreePrivacyYn,
          agreeTerms: agreeTermsYn,
          agreeMarketing: agreeMarketingYn,
        },
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && /users\.email/.test(err.sqlMessage || '')) {
        return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
      }
      throw err;
    }

    const user = { id: result.insertId, name, email };
    const accessToken = signAccessToken(user);
    return res.status(201).json({ user, accessToken });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
    }

    const users = await runQuery(
      'SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1',
      { email },
    );
    const user = users[0];

    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatched) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const accessToken = signAccessToken(user);
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
    });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해 주세요.' });
    }

    const users = await runQuery(
      'SELECT id, email FROM users WHERE email = :email LIMIT 1',
      { email },
    );
    const user = users[0];

    if (!user) {
      return res.json({ message: '해당 이메일이 존재하면 비밀번호 재설정 링크를 보냈습니다.' });
    }

    const rawToken = createRandomToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000);

    await runQuery(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES (:userId, :tokenHash, :expiresAt)`,
      { userId: user.id, tokenHash, expiresAt },
    );

    const resetUrl = `${env.appBaseUrl}/reset-password?token=${rawToken}`;
    const transporter = getTransporter();

    if (transporter) {
      try {
        const mail = buildPasswordResetEmail({ resetUrl, ttlMinutes: env.resetTokenTtlMinutes });
        const from = env.smtpFrom.includes('<') ? env.smtpFrom : `BlueNote <${env.smtpFrom}>`;
        await transporter.sendMail({
          from,
          to: user.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
      } catch (mailError) {
        if (process.env.NODE_ENV !== 'test') {
          // eslint-disable-next-line no-console
          console.error('SMTP send failed:', mailError.message);
        }
        return res.status(503).json({
          message: '이메일 발송에 실패했습니다. SMTP 설정을 확인하거나 나중에 다시 시도해 주세요.',
        });
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
      return res.json({
        message: '개발 모드: SMTP 미설정이라 리셋 링크를 응답으로 제공합니다.',
        resetUrl,
      });
    }

    return res.json({ message: '해당 이메일이 존재하면 비밀번호 재설정 링크를 보냈습니다.' });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ message: '토큰과 새 비밀번호(6자 이상)를 입력해 주세요.' });
    }

    const tokenHash = sha256(token);
    const rows = await runQuery(
      `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token_hash = :tokenHash
       ORDER BY id DESC
       LIMIT 1`,
      { tokenHash },
    );

    const resetRow = rows[0];
    if (!resetRow || resetRow.used_at || new Date(resetRow.expires_at) < new Date()) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await runQuery(
      'UPDATE users SET password_hash = :passwordHash WHERE id = :userId',
      { passwordHash, userId: resetRow.user_id },
    );
    await runQuery(
      'UPDATE password_resets SET used_at = NOW() WHERE id = :id',
      { id: resetRow.id },
    );

    return res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    return next(error);
  }
}
