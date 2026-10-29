import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FdrDocument } from '../types';
import {
  FolderLock,
  Download,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';

export const DocumentsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getAllDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const filtered = documents.filter((doc) => {
    if (typeFilter !== 'ALL' && doc.documentType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        doc.originalFileName.toLowerCase().includes(q) ||
        doc.fdrRecordId.toLowerCase().includes(q) ||
        doc.institutionName?.toLowerCase().includes(q) ||
        doc.fdrNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
            <FolderLock className="w-4 h-4 text-blue-700" />
            Module 4 · Secure Document Vault & Evidence Repository
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Institutional Document & Receipt Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted storage with cryptographic SHA-256 fingerprint verification and malware scan protection
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filtered.length}</strong> verified files in vault
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name, FDR record ID, institution, or receipt number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="ALL">All Document Types</option>
            <option value="FDR_RECEIPT">FDR Receipts</option>
            <option value="BANK_CONFIRMATION">Bank Confirmations</option>
            <option value="JOINT_LIEN_LETTER">Joint Lien Endorsements</option>
            <option value="RENEWAL_LETTER">Renewal Documentation</option>
            <option value="RELEASE_NOC">Release NOCs</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading secure document vault...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Documents Found</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document File</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Linked FDR</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Scan Status</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.originalFileName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                        Hash: {doc.sha256Hash}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-900">
                      {doc.documentType}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate(`fdr-detail-${doc.fdrRecordId}`)}
                        className="font-mono text-blue-700 hover:underline font-bold"
                      >
                        {doc.fdrRecordId}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 truncate max-w-[160px]">
                        {doc.institutionName}
                      </div>
                      <div className="text-[10px] text-slate-400">{doc.aicteCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {doc.scanStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={api.getDownloadUrl(doc.id)}
                        download={doc.originalFileName}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
