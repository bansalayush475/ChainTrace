import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import {
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  X,
  LogOut,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const SECTIONS = ['Account', 'Security', 'Investigation Preferences', 'Notifications'];

// Cryptographic SHA-256 hashing helper
async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, addAuditLog, logout } = useStore();
  const [activeSection, setActiveSection] = useState('Account');

  // Account Personal Profile Information
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '+91 98110 44291');
  const [badgeNo, setBadgeNo] = useState(user?.badgeNo ?? 'CT-RES-091');
  const [designation, setDesignation] = useState(user?.designation ?? (user?.role || 'Lead Crypto Forensic Specialist'));
  const [team, setTeam] = useState(user?.team ?? 'Special Cell Cyber Operations');
  const [jurisdiction, setJurisdiction] = useState(user?.jurisdiction ?? 'ChainTrace Research Workspace');
  const [serviceId, setServiceId] = useState(user?.serviceId ?? 'GOI-LEA-2024-8842');
  const [supervisorEmail, setSupervisorEmail] = useState(user?.supervisorEmail ?? 'lead-researcher@chaintrace.org');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact ?? '+91 11 2345 6789');
  const [stationAddress, setStationAddress] = useState(user?.stationAddress ?? 'NCFL Complex, Sector-4, R.K. Puram, New Delhi - 110022');

  // Investigation Preferences
  const [defaultChain, setDefaultChain] = useState('ETH');
  const [autoExpand, setAutoExpand] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(70);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

  // Change Password Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [prevPassword, setPrevPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPrevPw, setShowPrevPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwCaptchaCode, setPwCaptchaCode] = useState('');
  const [pwCaptchaInput, setPwCaptchaInput] = useState('');
  const [pwCaptchaError, setPwCaptchaError] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const captchaCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate safe 5-character alphanumeric captcha
  const generateCaptcha = useCallback((): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 5; i++) res += chars[Math.floor(Math.random() * chars.length)];
    return res;
  }, []);

  // Draw AI/OCR-resistant image captcha on canvas
  const drawCaptcha = useCallback((code: string) => {
    const canvas = captchaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Dark background
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, W, H);

    // Random noise dots
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${120 + Math.floor(Math.random() * 100)},${120 + Math.floor(Math.random() * 100)},${180 + Math.floor(Math.random() * 75)},0.45)`;
      ctx.fill();
    }

    // Interference line strokes
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.strokeStyle = `rgba(${60 + Math.floor(Math.random() * 120)},${120 + Math.floor(Math.random() * 100)},${220},0.35)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw characters with distinct rotations and colors
    const charW = W / (code.length + 1);
    const palette = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f87171'];
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = charW * (i + 0.8) + (Math.random() - 0.5) * 5;
      const y = H / 2 + 5 + (Math.random() - 0.5) * 6;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      const size = 18 + Math.floor(Math.random() * 4);
      ctx.font = `bold ${size}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = palette[i % palette.length];
      ctx.shadowColor = palette[i % palette.length];
      ctx.shadowBlur = 4;
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }

    // Overlay wave
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = H / 2 + Math.sin(x * 0.08) * 5 + (Math.random() - 0.5) * 2;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }, []);

  const refreshModalCaptcha = useCallback(() => {
    const code = generateCaptcha();
    setPwCaptchaCode(code);
    setPwCaptchaInput('');
    setPwCaptchaError(false);
    setTimeout(() => drawCaptcha(code), 20);
  }, [drawCaptcha, generateCaptcha]);

  useEffect(() => {
    if (passwordModalOpen) {
      refreshModalCaptcha();
      setPrevPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwError(null);
      setPwSuccess(null);
    }
  }, [passwordModalOpen, refreshModalCaptcha]);

  function handleSave() {
    updateUser({
      name,
      email,
      phone,
      badgeNo,
      designation,
      team,
      jurisdiction,
      serviceId,
      supervisorEmail,
      emergencyContact,
      stationAddress,
    });
    addAuditLog({
      user: name || 'Investigator',
      action: 'SETTINGS_CHANGE',
      resource: 'USER_PREFERENCES',
      ip: '192.168.1.100',
      details: 'Updated officer personal identity & jurisdictional profile',
    });
    setSavedMsg('Personal and account details saved successfully.');
    setTimeout(() => setSavedMsg(''), 2500);
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!prevPassword.trim()) {
      setPwError('Please enter your previous/current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation password do not match.');
      return;
    }

    if (pwCaptchaInput.trim().toUpperCase() !== pwCaptchaCode.toUpperCase()) {
      setPwCaptchaError(true);
      setPwError('Security verification CAPTCHA is incorrect.');
      return;
    }

    setPwSaving(true);

    try {
      // Hash password using SHA-256 for secure, irreversible storage
      const passwordHash = await sha256(newPassword);

      // Persist password hash string to user profile
      updateUser({ passwordHash });

      addAuditLog({
        user: user?.name || name || 'Investigator',
        action: 'PASSWORD_CHANGE',
        resource: 'AUTH_CREDENTIALS',
        ip: '192.168.1.100',
        details: 'Officer credentials updated and sealed with SHA-256 cryptographic hash',
      });

      setPwSuccess('Password successfully updated and securely hashed (SHA-256)!');
      setTimeout(() => {
        setPasswordModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password securely.');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: 'rgba(66,153,225,0.15)', color: 'var(--accent)', border: '1px solid rgba(66,153,225,0.3)', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
              OFFICER ACCOUNT &amp; PREFERENCES
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PLATFORM USER DIRECTORY</span>
          </div>
          <h1 style={{ margin: '8px 0 4px 0', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Account Profile &amp; Officer Preferences
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Manage your personal identity profile, statutory jurisdiction, account credentials, and platform preferences.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px 14px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <ShieldCheck size={15} style={{ color: '#22c55e' }} />
            <span>Identity Status: <strong>AUTHENTICATED LEA</strong></span>
          </div>
        </div>
      </motion.div>

      {savedMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ padding: '12px 16px', background: 'rgba(56,161,105,0.12)', border: '1px solid rgba(56,161,105,0.3)', borderRadius: '6px', color: '#22c55e', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle size={16} />
          {savedMsg}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Sidebar */}
        <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '3px', height: 'fit-content' }}>
          {SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              style={{
                padding: '10px 14px',
                background: activeSection === section ? 'rgba(66,153,225,0.12)' : 'none',
                border: 'none',
                borderLeft: `3px solid ${activeSection === section ? 'var(--accent)' : 'transparent'}`,
                borderRadius: '0 6px 6px 0',
                color: activeSection === section ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: activeSection === section ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {section}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '24px' }}>
          {/* ══════════════ 1. ACCOUNT TAB (EXPANDED PERSONAL OPTIONS) ══════════════ */}
          {activeSection === 'Account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Officer Profile &amp; Personal Information
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Personal records, badge identification, contact coordinates, and statutory jurisdiction.
                </p>
              </div>

              {/* Personal Identity Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Personal &amp; Contact Coordinates
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      FULL NAME *
                    </label>
                    <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="Officer Full Name" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      OFFICIAL LEA EMAIL ID *
                    </label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="officer@agency.gov.in" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      OFFICIAL MOBILE / CONTACT
                    </label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="+91 98765 43210" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      EMERGENCY CONTACT PHONE
                    </label>
                    <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="+91 11 2345 6789" />
                  </div>
                </div>
              </div>

              {/* Service & Station Credentials Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Service &amp; Jurisdictional Credentials
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      BADGE / WARRANT NO.
                    </label>
                    <input value={badgeNo} onChange={(e) => setBadgeNo(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="CT-RES-091" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      DESIGNATION / RANK
                    </label>
                    <input value={designation} onChange={(e) => setDesignation(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="Inspector / Lead Analyst" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      DEPARTMENT / UNIT
                    </label>
                    <input value={team} onChange={(e) => setTeam(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="Special Cell Cyber Operations" />
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      GOVERNMENT SERVICE ID / PPO
                    </label>
                    <input value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="GOI-LEA-2024-8842" />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      ASSIGNED RESEARCH TEAM / REGION
                    </label>
                    <input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="ChainTrace Research Workspace" />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      ORGANIZATION / AFFILIATION
                    </label>
                    <input value={stationAddress} onChange={(e) => setStationAddress(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="NCFL Complex, Sector-4, New Delhi" />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      SUPERVISORY / REPORTING OFFICER EMAIL
                    </label>
                    <input value={supervisorEmail} onChange={(e) => setSupervisorEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="lead-researcher@chaintrace.org" />
                  </div>
                </div>
              </div>

              {/* Clearance Status & Clean Sign Out Box */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  OPERATIONAL CLEARANCE &amp; ACTIVE SESSION
                </label>
                <div
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user?.role || designation}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: user?.roleType === 'JUNIOR' ? '#15803d' : 'var(--accent)',
                        fontWeight: 700,
                        marginTop: '2px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {user?.clearanceLevel || 'LEVEL-4 TOP SECRET'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Authenticated through ChainTrace Verified Researcher Directory.
                    </div>
                  </div>

                  {/* ONLY Sign Out Button (No Switch Option) */}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      padding: '8px 18px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: 'var(--risk-critical)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 24px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Update Account Details
              </button>
            </div>
          )}

          {/* ══════════════ 2. SECURITY TAB (CHANGE PASSWORD TRIGGER) ══════════════ */}
          {activeSection === 'Security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Security &amp; Credential Governance</h2>

              {/* MFA Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Multi-Factor Authentication (MFA)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Statutory two-factor token sent to official agency email under Section 79A IT Act
                  </div>
                </div>
                <div
                  onClick={() => setMfaEnabled((v) => !v)}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '11px',
                    background: mfaEnabled ? '#38a169' : 'var(--border)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: mfaEnabled ? '21px' : '3px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </div>

              {/* Trigger Change Password Popup */}
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Officer Access Password</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Password records are stored exclusively in irreversible SHA-256 hashed form for maximum cryptographic privacy.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(true)}
                  style={{
                    padding: '8px 18px',
                    background: 'rgba(237, 137, 54, 0.12)',
                    border: '1px solid rgba(237, 137, 54, 0.35)',
                    borderRadius: '6px',
                    color: '#ed8936',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={13} />
                  <span>Change Password</span>
                </button>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Active Forensic Console Sessions</h3>
                {[
                  { device: 'NIC Encrypted Browser on Windows', ip: '10.0.12.84', location: 'New Delhi (NCFL HQ)', current: true },
                  { device: 'Researcher Workstation', ip: '10.14.2.19', location: 'Mumbai Node', current: false },
                ].map((session) => (
                  <div
                    key={session.ip}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {session.device} {session.current && <span style={{ color: '#38a169', fontSize: '11px' }}>(current session)</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                        {session.ip} · {session.location}
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          borderRadius: '4px',
                          color: 'var(--risk-critical)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'Investigation Preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Investigation Preferences</h2>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>DEFAULT BLOCKCHAIN</label>
                <select value={defaultChain} onChange={(e) => setDefaultChain(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                  {['ETH', 'BTC', 'TRON', 'POLYGON', 'BNB'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div><div style={{ fontWeight: 600 }}>Auto-expand graph hops</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automatically trace 3 hops on wallet open</div></div>
                <div onClick={() => setAutoExpand((v) => !v)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: autoExpand ? '#38a169' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: autoExpand ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>ALERT RISK THRESHOLD: {alertThreshold}</label>
                <input type="range" min={10} max={100} step={5} value={alertThreshold} onChange={(e) => setAlertThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
              <button onClick={handleSave} style={{ alignSelf: 'flex-start', padding: '9px 24px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save Preferences</button>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Notification Preferences</h2>
              {[
                ['Critical Alerts', 'Immediate notification for critical severity alerts'],
                ['High Risk Wallets', 'Alert when a watched wallet risk score exceeds threshold'],
                ['Investigation Updates', 'Notify when case status changes'],
                ['Evidence Integrity', 'Alert on evidence verification failures'],
                ['Exchange Attribution', 'Notify on new VASP identifications'],
                ['System Alerts', 'Infrastructure and incident notifications'],
              ].map(([title, desc]) => (
                <NotificationRow key={String(title)} title={String(title)} desc={String(desc)} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Change Password Modal Dialog */}
      {passwordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setPasswordModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(237, 137, 54, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(237, 137, 54, 0.15)',
                    border: '1px solid rgba(237, 137, 54, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ed8936',
                  }}
                >
                  <Lock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#ed8936', textTransform: 'uppercase' }}>
                    SECURITY &amp; CREDENTIAL SEAL
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Change Account Password
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleChangePasswordSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                To safeguard officer identity records, passwords are cryptographically hashed using SHA-256 before storage. Plaintext passwords are never stored or accessible by anyone.
              </p>

              {pwError && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: 'var(--risk-critical)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{pwError}</span>
                </div>
              )}

              {pwSuccess && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{pwSuccess}</span>
                </div>
              )}

              {/* Previous / Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  PREVIOUS / CURRENT PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPrevPw ? 'text' : 'password'}
                    value={prevPassword}
                    onChange={(e) => setPrevPassword(e.target.value)}
                    placeholder="Enter your current password"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrevPw(!showPrevPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    {showPrevPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password (1st verification) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  NEW PASSWORD (VERIFICATION 1/2) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create new password (min. 6 characters)"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password (2nd verification) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  CONFIRM NEW PASSWORD (VERIFICATION 2/2) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password to verify"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* AI-Resistant Image-Generated CAPTCHA */}
              <div
                style={{
                  padding: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                    SECURITY VERIFICATION CAPTCHA (IMAGE-GENERATED) *
                  </label>
                  <button
                    type="button"
                    onClick={refreshModalCaptcha}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <RotateCw size={12} />
                    <span>Refresh Image</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      lineHeight: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                  >
                    <canvas ref={captchaCanvasRef} width={130} height={38} style={{ display: 'block' }} />
                  </div>
                  <input
                    type="text"
                    value={pwCaptchaInput}
                    onChange={(e) => {
                      setPwCaptchaInput(e.target.value);
                      setPwCaptchaError(false);
                    }}
                    placeholder="Enter CAPTCHA"
                    maxLength={5}
                    required
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      border: `1px solid ${pwCaptchaError ? 'var(--risk-critical)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
                  Image noise and interference patterns prevent automated AI extraction.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwSaving}
                  style={{
                    padding: '9px 20px',
                    background: pwSaving ? '#a0aec0' : '#ed8936',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: pwSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(237, 137, 54, 0.3)',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>{pwSaving ? 'Hashing & Saving...' : 'Save Hashed Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function NotificationRow({ title, desc }: { title: string; desc: string }) {
  const [emailOn, setEmailOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={emailOn} onChange={() => setEmailOn((v) => !v)} style={{ accentColor: 'var(--accent)' }} />
          Email
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={pushOn} onChange={() => setPushOn((v) => !v)} style={{ accentColor: 'var(--accent)' }} />
          Push
        </label>
      </div>
    </div>
  );
}
