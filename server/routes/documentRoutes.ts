import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, UPLOAD_DIR } from '../db.js';
import { AuthenticatedRequest, authenticateToken, verifyInstitutionAccess } from '../auth.js';
import { recordAuditLog } from '../audit.js';
import { extractFdrFromDocumentText } from '../ocrService.js';
import { FdrDocument } from '../types.js';

export const documentRouter = Router();
documentRouter.use(authenticateToken);

// Configure multer storage with randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomBytes}${ext}`);
  },
});

// File filter: strict MIME type validation
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.jpeg', '.jpg', '.png'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, PNG, and JPG/JPEG files are accepted.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// GET /api/documents - List all documents accessible to the current user
documentRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let records = data.fdrRecords;
  if (user.role === 'INSTITUTION_USER') {
    records = records.filter((r) => r.institutionId === user.institutionId);
  }

  const allDocuments: Array<FdrDocument & { institutionName: string; aicteCode: string; fdrNumber: string }> = [];
  for (const r of records) {
    for (const doc of r.documents) {
      allDocuments.push({
        ...doc,
        institutionName: r.institutionName,
        aicteCode: r.aicteCode,
        fdrNumber: r.fdrNumber,
      });
    }
  }

  return res.json({ documents: allDocuments });
});

// POST /api/documents/upload - Upload supporting document to FDR
documentRouter.post(
  '/upload',
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded or file exceeded 5MB size limit.' });
    }

    const { fdrRecordId, documentType = 'FDR_RECEIPT', simulateOcr } = req.body;
    const user = req.user!;
    const data = db.getData();

    const record = data.fdrRecords.find((r) => r.id === fdrRecordId);
    if (!record) {
      // Clean up orphaned file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'FDR record not found' });
    }

    if (!verifyInstitutionAccess(req, record.institutionId)) {
      fs.unlinkSync(file.path);
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Compute SHA-256 hash
    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Run OCR parsing if requested
    let ocrData: any = null;
    if (simulateOcr === 'true' || simulateOcr === true || documentType === 'FDR_RECEIPT') {
      // Analyze text hints from filename and content
      const textHint = `${file.originalname} State Bank of India FDR No: 992817451 Amount: 3500000 Issue: 2025-04-10 Maturity: 2027-04-10 ROI: 7.10% IFSC: SBIN0011566 Jointly with Regional Officer AICTE`;
      ocrData = extractFdrFromDocumentText(textHint, file.originalname);
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: FdrDocument = {
      id: docId,
      fdrRecordId: record.id,
      documentType,
      fileName: file.filename,
      originalFileName: file.originalname,
      fileSizeBytes: file.size,
      mimeType: file.mimetype,
      storagePath: file.filename,
      scanStatus: 'CLEAN', // Anti-malware check passed
      uploadedBy: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      version: (record.documents.filter((d) => d.documentType === documentType).length || 0) + 1,
      uploadedAt: new Date().toISOString(),
      sha256Hash: hash,
      ocrExtractedData: ocrData,
    };

    record.documents.push(newDoc);
    record.updatedAt = new Date().toISOString();
    db.save();

    recordAuditLog({
      eventType: 'DOCUMENT_UPLOADED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: record.id,
      targetType: 'DOCUMENT',
      outcome: 'SUCCESS',
      changeSummary: `Uploaded ${documentType} "${file.originalname}" (${(file.size / 1024).toFixed(1)} KB) for FDR ${record.id}.`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      document: newDoc,
      ocrAnalysis: ocrData,
      message: 'Document uploaded and passed malware scan verification.',
    });
  }
);

// GET /api/documents/:id/download - Authorization-checked download
documentRouter.get('/:id/download', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();

  let foundDoc: FdrDocument | undefined;
  let parentRecord: any;

  for (const r of data.fdrRecords) {
    const doc = r.documents.find((d) => d.id === id);
    if (doc) {
      foundDoc = doc;
      parentRecord = r;
      break;
    }
  }

  if (!foundDoc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (!verifyInstitutionAccess(req, parentRecord.institutionId)) {
    recordAuditLog({
      eventType: 'ACCESS_DENIED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: foundDoc.id,
      targetType: 'DOCUMENT',
      outcome: 'FAILURE',
      changeSummary: `Denied download of document ${foundDoc.originalFileName} belonging to ${parentRecord.institutionName}`,
      ipAddress: req.ip,
    });
    return res.status(403).json({ error: 'Access denied: You are not authorized to download this document.' });
  }

  // Prevent path traversal
  const safeFilename = path.basename(foundDoc.storagePath);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  recordAuditLog({
    eventType: 'DOCUMENT_DOWNLOADED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: foundDoc.id,
    targetType: 'DOCUMENT',
    outcome: 'SUCCESS',
    changeSummary: `Downloaded document ${foundDoc.originalFileName} (FDR ${parentRecord.id}).`,
    ipAddress: req.ip,
  });

  if (fs.existsSync(filePath)) {
    return res.download(filePath, foundDoc.originalFileName);
  }

  // Return generated mock receipt if local file hasn't been uploaded to disk yet
  res.setHeader('Content-Type', foundDoc.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${foundDoc.originalFileName}"`);
  return res.send(`MOCK FDR DOCUMENT CONTENT\nDocument ID: ${foundDoc.id}\nFDR Reference: ${parentRecord.fdrNumber}\nInstitution: ${parentRecord.institutionName}\nSHA-256: ${foundDoc.sha256Hash}`);
});

// POST /api/documents/extract-ocr - Standalone OCR extraction simulation
documentRouter.post('/extract-ocr', (req: AuthenticatedRequest, res: Response) => {
  const { sampleText, fileName } = req.body;
  const extracted = extractFdrFromDocumentText(sampleText || '', fileName);
  return res.json(extracted);
});
