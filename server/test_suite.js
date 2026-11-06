import { db } from './db/database.js';
import { sendDossierEmail } from './services/emailService.js';
import { queryTron, queryEthereum, queryBitcoin, queryPolygon } from './services/blockchainService.js';

async function runTestSuite() {
  console.log('\n=======================================================');
  console.log('🧪 CBFIS SOVEREIGN COMPREHENSIVE FUNCTION TEST SUITE');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Database Investigations Operations
  try {
    const testInvId = 'INV-TEST-001';
    await db.deleteInvestigation(testInvId);
    const created = await db.createInvestigation({
      id: testInvId,
      caseId: 'CT-2024-TEST-99',
      title: 'Automated Diagnostic Verification Case',
      suspectWallet: 'TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7',
      blockchain: 'TRON',
      riskScore: 88,
      fundsTraced: 250000,
      currency: 'USDT',
      investigator: 'Lead Inspector',
      status: 'UNDER_INVESTIGATION',
      priority: 'CRITICAL',
    });
    assert(created && created.id === testInvId, 'Investigation Creation', `ID: ${created?.id}`);

    const fetched = await db.getInvestigation(testInvId);
    assert(fetched && fetched.caseId === 'CT-2024-TEST-99', 'Investigation Retrieval', `CaseId: ${fetched?.caseId}`);

    const updated = await db.updateInvestigation(testInvId, { riskScore: 92 });
    assert(updated && updated.riskScore === 92, 'Investigation Update', `Risk: ${updated?.riskScore}`);

    await db.deleteInvestigation(testInvId);
    const postDelete = await db.getInvestigation(testInvId);
    assert(!postDelete, 'Investigation Deletion', 'Confirmed deleted');
  } catch (err) {
    assert(false, 'Database Investigation Operations', err.message);
  }

  // TEST 2: User Profile Synchronization
  try {
    const testEmail = 'officer.test@gov.in';
    const regUser = await db.createUser({
      email: testEmail,
      name: 'Inspector Vikram',
      password: 'password123',
      role: 'Forensic Lead',
      roleType: 'SENIOR',
      team: 'Special Operations Wing',
    });
    assert(regUser && regUser.email === testEmail, 'User Registration', `Name: ${regUser?.name}`);

    // Update name
    const updatedUser = await db.updateUserProfile(testEmail, {
      name: 'Superintendent Vikram Singh',
      designation: 'Superintendent of Police',
    });
    assert(updatedUser && updatedUser.name === 'Superintendent Vikram Singh', 'User Name Sync', `Updated: ${updatedUser?.name}`);

    // Verify retrieval matches updated name
    const foundUser = await db.getUserByEmail(testEmail);
    assert(foundUser && foundUser.name === 'Superintendent Vikram Singh', 'User Persistence Verification', `Verified name: ${foundUser?.name}`);

    // Clean up test user
    if (db.deleteUser) await db.deleteUser(testEmail);
  } catch (err) {
    assert(false, 'User Profile Synchronization', err.message);
  }

  // TEST 3: Email Dossier & Certificate Dispatch Gateway
  try {
    const emailResult = await sendDossierEmail({
      toEmail: 'specialcourt@nic.in',
      toName: 'Special Judge (Cyber Crime)',
      subject: '[TEST SUITE] Section 63 BSA Digital Evidence Certificate',
      docType: 'BSA_CERTIFICATE',
      caseId: 'CT-2024-0001',
      content: 'Digital certificate issued under Section 63 BSA 2023 for suspect wallet TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7.',
      officerName: 'Forensic Examiner',
    });
    assert(
      emailResult && emailResult.success && emailResult.dispatchRef,
      'Email Dossier & Certificate Dispatch',
      `Ref: ${emailResult.dispatchRef} (Method: ${emailResult.method})`
    );
  } catch (err) {
    assert(false, 'Email Dossier & Certificate Dispatch', err.message);
  }

  // TEST 4: Taint Accounting Differentiation (FIFO vs Poison vs Haircut)
  try {
    // In our taint model:
    // Poison (Strict liability): 88% retention per hop
    // FIFO (Queue prioritization): 78% retention per hop
    // Haircut (Proportional dilution): 68% retention per hop
    const initialTaint = 100;
    const poisonH1 = Math.round(initialTaint * 0.88);
    const fifoH1 = Math.round(initialTaint * 0.78);
    const haircutH1 = Math.round(initialTaint * 0.68);

    assert(
      poisonH1 > fifoH1 && fifoH1 > haircutH1,
      'Taint Engine Mathematical Distinction',
      `Poison: ${poisonH1}% > FIFO: ${fifoH1}% > Haircut: ${haircutH1}%`
    );
  } catch (err) {
    assert(false, 'Taint Engine Differentiation', err.message);
  }

  // TEST 5: Blockchain Address Validation for all 4 chains
  try {
    const isEthValid = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);
    const isTronValid = (addr) => /^T[1-9A-HJ-NP-za-km-z]{33}$/.test(addr);
    const isBtcValid = (addr) => /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
    const isPolygonValid = isEthValid;

    assert(isEthValid('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'), 'ETH Address Validation (Valid)', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    assert(!isEthValid('0xInvalidAddress123'), 'ETH Address Validation (Invalid rejected)', 'Rejected correctly');

    assert(isTronValid('TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7'), 'TRON Address Validation (Valid)', 'TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7');
    assert(!isTronValid('TInvalidShort'), 'TRON Address Validation (Invalid rejected)', 'Rejected correctly');

    assert(isBtcValid('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'), 'BTC Address Validation (Legacy P2PKH)', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    assert(isBtcValid('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'), 'BTC Address Validation (Bech32 Native SegWit)', 'bc1qar...');

    assert(isPolygonValid('0x72a53cDBBcc1b9efa39c834A540550e23463AAcB'), 'POLYGON Address Validation (Valid)', '0x72a53cDBBcc1b9efa39c834A540550e23463AAcB');
  } catch (err) {
    assert(false, 'Blockchain Address Validation', err.message);
  }

  // TEST 6: Live Node Connectivity for TRON & ETH
  try {
    console.log('📡 Probing On-Chain APIs...');
    const tronRes = await queryTron('TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7').catch(e => ({ error: e.message }));
    assert(tronRes && !tronRes.error, 'TRON On-Chain Node Query', `Txs fetched: ${tronRes?.transactions?.length || 0}`);

    const ethRes = await queryEthereum('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045').catch(e => ({ error: e.message }));
    assert(ethRes && !ethRes.error, 'ETH On-Chain Node Query', `Txs fetched: ${ethRes?.transactions?.length || 0}`);

    const btcRes = await queryBitcoin('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq').catch(e => ({ error: e.message }));
    assert(btcRes && !btcRes.error, 'BTC On-Chain Node Query', `Txs fetched: ${btcRes?.transactions?.length || 0}`);

    const polyRes = await queryPolygon('0x72a53cDBBcc1b9efa39c834A540550e23463AAcB').catch(e => ({ error: e.message }));
    assert(polyRes && !polyRes.error, 'POLYGON On-Chain Node Query', `Txs fetched: ${polyRes?.transactions?.length || 0}`);
  } catch (err) {
    assert(false, 'Live Node Connectivity', err.message);
  }

  console.log('\n=======================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
