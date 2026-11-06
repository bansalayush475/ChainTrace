import { Router } from 'express';
import { sendDossierEmail } from '../services/emailService.js';
import { db } from '../db/database.js';

const router = Router();

/**
 * POST /api/email/dispatch-dossier
 * Direct dispatch of Section 63 BSA Evidence Certificates, Forensic Dossiers, and Freeze Orders
 */
router.post('/dispatch-dossier', async (req, res) => {
  try {
    const {
      toEmail,
      toName,
      subject,
      docType,
      caseId,
      content,
      html,
      officerName,
    } = req.body;

    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email address (toEmail) is required.' });
    }

    const result = await sendDossierEmail({
      toEmail,
      toName: toName || 'Authorized Officer / Recipient',
      subject: subject || `[CONFIDENTIAL LEA DOSSIER] Statutory Case Evidence: ${caseId || 'CT-2024'}`,
      docType: docType || 'FORENSIC_DOSSIER',
      caseId: caseId || 'CASE-GENERAL',
      content: content || '',
      html: html || '',
      officerName: officerName || 'Investigating Officer',
    });

    // Record statutory audit log entry
    await db.addAuditLog({
      user: officerName || 'Investigating Officer',
      action: 'DOSSIER_DISPATCHED_EMAIL',
      resource: caseId || result.dispatchRef,
      ip: req.ip || '127.0.0.1',
      details: `Statutory ${docType || 'Dossier'} dispatched to ${toEmail} via ${result.method}. Seal: ${result.shaSeal.slice(0, 16)}...`,
    });

    res.json({
      success: true,
      delivered: true,
      message: `Document successfully dispatched to ${toEmail} via ${result.method === 'SOVEREIGN_SIMULATED' ? 'Sovereign LEA Encrypted Webmail Gateway' : result.method}.`,
      dispatchRef: result.dispatchRef,
      shaSeal: result.shaSeal,
      timestamp: result.timestamp,
      method: result.method,
    });
  } catch (err) {
    console.error('[Email Router] Dispatch failed:', err);
    res.status(500).json({ error: 'Failed to dispatch dossier email', details: err.message });
  }
});

export default router;
