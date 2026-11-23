import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivoquest_dev';

export async function runSeed() {
  console.log(`[Seed] Connecting to MongoDB...`);
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db();
    const now = new Date();

    console.log('[Seed] Seeding Roles & Permissions...');
    const permissions = [
      { action: 'care.records.read', module: 'care', description: 'Read clinical records and summaries' },
      { action: 'care.records.write', module: 'care', description: 'Create and update patient records' },
      { action: 'care.prescriptions.write', module: 'care', description: 'Issue digital prescriptions' },
      { action: 'care.visits.manage', module: 'care', description: 'Create and update visits and shifts' },
      { action: 'care.vitals.record', module: 'care', description: 'Record patient physiological vitals' },
      { action: 'pay.orders.create', module: 'pay', description: 'Initiate marketplace orders and payments' },
      { action: 'pay.refund.request', module: 'pay', description: 'Submit refund request (Maker)' },
      { action: 'pay.refund.approve', module: 'pay', description: 'Approve refund request (Checker)' },
      { action: 'pay.reconciliation.run', module: 'pay', description: 'Execute settlement and bank reconciliation' },
      { action: 'cmp.audit.read', module: 'cmp', description: 'View immutable audit log trail' },
      { action: 'cmp.dsr.manage', module: 'cmp', description: 'Process DPDP data subject requests' },
      { action: 'rpt.generate', module: 'rpt', description: 'Request server-side PDF and Excel reports' },
    ];

    for (const p of permissions) {
      await db.collection('iam_permissions').updateOne(
        { action: p.action },
        {
          $set: {
            ...p,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: {
            createdAt: now,
          }
        },
        { upsert: true }
      );
    }

    const roles = [
      {
        key: 'patient',
        name: 'Patient',
        description: 'Care recipient accessing records, appointments and downloads',
        permissions: ['care.records.read', 'pay.orders.create', 'rpt.generate'],
        isSystem: true
      },
      {
        key: 'caregiver',
        name: 'Caregiver / Family',
        description: 'Family or assigned caregiver with patient relationship consent',
        permissions: ['care.records.read', 'care.visits.manage', 'rpt.generate'],
        isSystem: true
      },
      {
        key: 'nurse',
        name: 'Registered Nurse',
        description: 'Field or facility nurse handling vitals, shifts and medication tracking',
        permissions: ['care.records.read', 'care.records.write', 'care.vitals.record', 'care.visits.manage'],
        isSystem: true
      },
      {
        key: 'clinician',
        name: 'Clinician / Physician',
        description: 'Licensed doctor managing prescriptions, orders, and discharge plans',
        permissions: ['care.records.read', 'care.records.write', 'care.prescriptions.write', 'rpt.generate'],
        isSystem: true
      },
      {
        key: 'remote_desk',
        name: 'Remote Care Desk',
        description: 'Central monitoring team handling escalations and shifts',
        permissions: ['care.records.read', 'care.visits.manage'],
        isSystem: true
      },
      {
        key: 'health_plan',
        name: 'Health Plan / ACO',
        description: 'Payer and ACO manager monitoring quality and outcome analytics',
        permissions: ['rpt.generate'],
        isSystem: true
      },
      {
        key: 'marketplace_seller',
        name: 'Marketplace Seller',
        description: 'Vendor managing catalog products and fulfillment shipments',
        permissions: ['pay.orders.create'],
        isSystem: true
      },
      {
        key: 'admin',
        name: 'System Administrator',
        description: 'Platform administrator with system-wide controls',
        permissions: permissions.map(p => p.action),
        isSystem: true
      },
      {
        key: 'auditor',
        name: 'Statutory Auditor',
        description: 'Government or external compliance auditor (read-only)',
        permissions: ['cmp.audit.read', 'rpt.generate'],
        isSystem: true
      },
      {
        key: 'finance',
        name: 'Finance Admin',
        description: 'Finance manager approving refunds and running reconciliations',
        permissions: ['pay.refund.request', 'pay.refund.approve', 'pay.reconciliation.run', 'rpt.generate'],
        isSystem: true
      }
    ];

    for (const r of roles) {
      await db.collection('iam_roles').updateOne(
        { key: r.key },
        {
          $set: {
            ...r,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: {
            createdAt: now,
          }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Seeding sys_counters...');
    await db.collection('sys_counters').updateOne(
      { seqKey: 'invoice_2026-27' },
      {
        $setOnInsert: {
          seqKey: 'invoice_2026-27',
          currentVal: 100,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
          createdBy: 'system',
          deletedAt: null
        }
      },
      { upsert: true }
    );

    console.log('[Seed] Seeding sys_feature_flags...');
    const flags = [
      { key: 'abdm_integration', description: 'ABHA linking and FHIR R4 milestone gateway', enabled: true, rolloutPercentage: 100 },
      { key: 'adult_vaccination_certificates', description: 'Digital vaccine certificate generation with QR', enabled: true, rolloutPercentage: 100 },
      { key: 'stripe_international_checkout', description: 'Stripe gateway for non-INR checkout', enabled: true, rolloutPercentage: 100 }
    ];

    for (const f of flags) {
      await db.collection('sys_feature_flags').updateOne(
        { key: f.key },
        {
          $set: {
            ...f,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Seeding cmp_controls...');
    const controls = [
      { code: 'DPDP-01', framework: 'DPDP_2023', title: 'Purpose-bound consent collection and storage', status: 'compliant' },
      { code: 'DPDP-02', framework: 'DPDP_2023', title: 'Right to withdraw consent with instant effect', status: 'compliant' },
      { code: 'DPDP-03', framework: 'DPDP_2023', title: 'Data principal access and 30-day DSR turnaround', status: 'compliant' },
      { code: 'RBI-01', framework: 'RBI_DATA', title: 'Localisation of payment data strictly within Indian regions', status: 'compliant' },
      { code: 'CERT-01', framework: 'CERT_IN', title: '180 days NTP-synchronised log retention in India', status: 'compliant' },
      { code: 'ISO-01', framework: 'ISO_27001', title: 'Maker-checker controls on critical financial actions', status: 'compliant' },
      { code: 'SOC-01', framework: 'SOC_2', title: 'Audit trail immutability via cryptographic hash chaining', status: 'compliant' },
    ];

    for (const c of controls) {
      await db.collection('cmp_controls').updateOne(
        { code: c.code },
        {
          $set: {
            ...c,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Seeding rpt_templates...');
    const reportTemplates = [
      { type: 'payments-workbook', name: 'Payments Consolidated Workbook', supportedFormats: ['xlsx'], periodic: true },
      { type: 'reconciliation', name: 'Daily Settlement Reconciliation Report', supportedFormats: ['xlsx', 'pdf'], periodic: true },
      { type: 'collections', name: 'Collections and Revenue Summary', supportedFormats: ['xlsx'], periodic: true },
      { type: 'refunds', name: 'Refunds & Credit Notes Audit', supportedFormats: ['xlsx'], periodic: true },
      { type: 'receivables', name: 'Aged Receivables (0-90+ days)', supportedFormats: ['xlsx'], periodic: true },
      { type: 'gst-ledger', name: 'GST Statutory Ledger (GSTR-1 Ready)', supportedFormats: ['xlsx'], periodic: true },
      { type: 'invoice', name: 'Tax Invoice with E-Invoice IRN & QR', supportedFormats: ['pdf'], periodic: false },
      { type: 'patient-care', name: 'Comprehensive Patient Care Summary', supportedFormats: ['pdf'], periodic: true },
      { type: 'my-data-copy', name: 'DPDP Data Principal Portability Extract', supportedFormats: ['pdf', 'xlsx'], periodic: false },
      { type: 'discharge-summary', name: 'Clinical Discharge & Transition Plan', supportedFormats: ['pdf'], periodic: false },
      { type: 'outcomes', name: 'ACO Quality and Health Outcomes Scorecard', supportedFormats: ['pdf', 'xlsx'], periodic: true },
      { type: 'compliance-pack', name: 'Government Audit Evidence Pack', supportedFormats: ['pdf', 'xlsx'], periodic: true },
      { type: 'audit-extract', name: 'Tamper-Evident Security Audit Log', supportedFormats: ['xlsx'], periodic: false },
      { type: 'table', name: 'Generic Filtered Data Extract', supportedFormats: ['xlsx'], periodic: false }
    ];

    for (const t of reportTemplates) {
      await db.collection('rpt_templates').updateOne(
        { type: t.type },
        {
          $set: {
            ...t,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Seeding mkt_categories & products...');
    const cat = await db.collection('mkt_categories').findOneAndUpdate(
      { slug: 'medical-devices' },
      {
        $set: {
          slug: 'medical-devices',
          name: 'Medical Devices & Diagnostics',
          description: 'Home healthcare vitals monitoring equipment',
          schemaVersion: 1,
          updatedAt: now,
          createdBy: 'system',
          deletedAt: null
        },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const catId = cat?._id || new ObjectId();

    const products = [
      {
        name: 'Omron Digital Blood Pressure Monitor HEM-7120',
        sku: 'DEV-BP-001',
        categoryId: catId,
        priceMinor: 249900, // Rs 2,499.00
        currency: 'INR',
        stockQuantity: 150,
        status: 'active',
        hsnSac: '9018',
        gstRatePercent: 12.0
      },
      {
        name: 'Dr. Morepen Finger Tip Pulse Oximeter PO-09',
        sku: 'DEV-OX-002',
        categoryId: catId,
        priceMinor: 129900, // Rs 1,299.00
        currency: 'INR',
        stockQuantity: 200,
        status: 'active',
        hsnSac: '9018',
        gstRatePercent: 12.0
      },
      {
        name: 'Accu-Chek Active Blood Glucose Glucometer',
        sku: 'DEV-GLU-003',
        categoryId: catId,
        priceMinor: 159900, // Rs 1,599.00
        currency: 'INR',
        stockQuantity: 100,
        status: 'active',
        hsnSac: '9018',
        gstRatePercent: 12.0
      }
    ];

    for (const pr of products) {
      await db.collection('mkt_products').updateOne(
        { sku: pr.sku },
        {
          $set: {
            ...pr,
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Seeding role-based credentials for all 10 user personas...');
    const hmacSecret = process.env.HMAC_SECRET || 'vivoquest_secret_salt';

    const roleUsers = [
      {
        phoneE164: '+919820011223',
        roles: ['patient'],
        currentRole: 'patient',
        name: 'Pooja Nair',
        city: 'Mumbai'
      },
      {
        phoneE164: '+919820022334',
        roles: ['caregiver'],
        currentRole: 'caregiver',
        name: 'Sunita Kulkarni',
        city: 'Pune'
      },
      {
        phoneE164: '+919820033445',
        roles: ['nurse'],
        currentRole: 'nurse',
        name: 'Vandana Rao, RN',
        city: 'Bengaluru'
      },
      {
        phoneE164: '+919820044556',
        roles: ['clinician'],
        currentRole: 'clinician',
        name: 'Dr. Arvind Swaminathan',
        city: 'Chennai'
      },
      {
        phoneE164: '+919820055667',
        roles: ['remote-desk'],
        currentRole: 'remote-desk',
        name: 'Anita Deshmukh',
        city: 'Hyderabad'
      },
      {
        phoneE164: '+919820066778',
        roles: ['discharge-planner'],
        currentRole: 'discharge-planner',
        name: 'Kavita Deshmukh',
        city: 'Delhi'
      },
      {
        phoneE164: '+919820077889',
        roles: ['health-plan'],
        currentRole: 'health-plan',
        name: 'Rajesh Varma',
        city: 'Mumbai'
      },
      {
        phoneE164: '+919820088990',
        roles: ['vaccination'],
        currentRole: 'vaccination',
        name: 'Priya Nair',
        city: 'Kochi'
      },
      {
        phoneE164: '+919820099001',
        roles: ['marketplace'],
        currentRole: 'marketplace',
        name: 'Rahul Sharma',
        city: 'Ahmedabad'
      },
      {
        phoneE164: '+919820000000',
        roles: ['admin', 'patient', 'caregiver', 'nurse', 'clinician', 'remote-desk', 'discharge-planner', 'health-plan', 'vaccination', 'marketplace'],
        currentRole: 'admin',
        name: 'Super Administrator',
        city: 'National'
      },
      {
        phoneE164: '+919876543210',
        roles: ['admin', 'patient', 'caregiver', 'nurse', 'clinician', 'remote-desk', 'discharge-planner', 'health-plan', 'vaccination', 'marketplace'],
        currentRole: 'admin',
        name: 'Legacy Super Admin',
        city: 'Pune'
      }
    ];

    for (const u of roleUsers) {
      const pHash = crypto.createHmac('sha256', hmacSecret).update(u.phoneE164).digest('hex');
      await db.collection('iam_users').updateOne(
        { phoneHash: pHash },
        {
          $set: {
            phoneE164: u.phoneE164,
            phoneHash: pHash,
            roles: u.roles,
            currentRole: u.currentRole,
            city: u.city,
            preferredLanguage: 'en',
            status: 'active',
            lastLoginAt: now,
            mfa: { enabled: false, secret: null, verifiedAt: null },
            schemaVersion: 1,
            updatedAt: now,
            createdBy: 'system',
            deletedAt: null
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    console.log('[Seed] Role users seeded successfully.');
    console.log('[Seed] Seeding finished successfully!');
  } catch (error) {
    console.error('[Seed] Failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  runSeed().then(() => {
    console.log('[Seed] Done.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}
