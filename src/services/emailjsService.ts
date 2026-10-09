/**
 * emailjsService.ts
 * Sends OTP emails via EmailJS CDN (no npm package needed).
 * EmailJS is loaded dynamically from jsdelivr CDN on first use.
 */

const EMAILJS_SERVICE_ID = 'service_xorxriz';
const EMAILJS_TEMPLATE_ID = 'template_s63u5l3';
const EMAILJS_PUBLIC_KEY = 'EGjXFyw7INsU4MXuP';

// Load EmailJS from CDN
function loadEmailJSFromCDN(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if ((window as any).emailjs) {
      resolve((window as any).emailjs);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).emailjs) {
        resolve((window as any).emailjs);
      } else {
        reject(new Error('EmailJS loaded but window.emailjs not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load EmailJS from CDN'));
    document.head.appendChild(script);
  });
}

export async function sendOtpViaEmailJS(params: {
  toEmail: string;
  toName: string;
  otpCode: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const emailjs = await loadEmailJSFromCDN();

    // Initialize with public key (safe to call multiple times)
    if (typeof emailjs.init === 'function') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    const templateParams = {
      to_email: params.toEmail,
      to_name: params.toName,
      otp_code: params.otpCode,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    if (response.status === 200) {
      return { success: true, message: `OTP sent to ${params.toEmail}` };
    } else {
      return { success: false, message: `EmailJS returned status ${response.status}` };
    }
  } catch (err: any) {
    console.error('[EmailJS] Send failed:', err);
    return {
      success: false,
      message: err?.text || err?.message || 'Failed to send OTP email',
    };
  }
}
