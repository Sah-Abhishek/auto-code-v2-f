import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Image, ClipboardPaste, ChevronDown, Send, X, Plus,
  Stethoscope, FlaskConical, ScanLine, ClipboardCheck, FileImage, File,
  Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

const DocumentIngestion = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ed-notes');
  const [formData, setFormData] = useState({
    mrn: '',
    chartNumber: '',
    facility: '',
    specialty: 'ED (Emergency Department)',
    dateOfService: '',
    provider: ''
  });

  const [uploads, setUploads] = useState({
    'ed-notes': { pdfs: [], images: [], texts: [] },
    'labs': { pdfs: [], images: [], texts: [] },
    'radiology': { pdfs: [], images: [], texts: [] },
    'discharge': { pdfs: [], images: [], texts: [] }
  });

  const [dragActive, setDragActive] = useState({ pdf: false, image: false });
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const tabs = [
    { id: 'ed-notes', label: 'ED Notes', icon: Stethoscope, color: 'blue' },
    { id: 'labs', label: 'Labs', icon: FlaskConical, color: 'emerald' },
    { id: 'radiology', label: 'Radiology', icon: ScanLine, color: 'violet' },
    { id: 'discharge', label: 'Discharge', icon: ClipboardCheck, color: 'amber' }
  ];

  const facilities = ["St. Mary's Medical Center", 'Community Medical', 'Regional Hospital', 'Metro General', 'University Health'];
  const specialties = ['ED (Emergency Department)', 'IP (Inpatient)', 'OP (Outpatient)', 'ICU', 'Surgery', 'Cardiology'];

  const getTabColor = (tabId, type = 'bg') => {
    const colors = {
      'ed-notes': { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      'labs': { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      'radiology': { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
      'discharge': { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
    };
    return colors[tabId]?.[type] || '';
  };

  const handleDrag = (e, type, isEnter) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: isEnter }));
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files, type);
  };

  const handleFileUpload = (files, type) => {
    const newFiles = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      file: file
    }));

    setUploads(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [type]: [...prev[activeTab][type], ...newFiles]
      }
    }));
  };

  const handleFileInput = (e, type) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files, type);
    e.target.value = '';
  };

  const addTextEntry = () => {
    if (!textInput.trim()) return;

    const newText = {
      id: Date.now(),
      content: textInput,
      preview: textInput.substring(0, 100) + (textInput.length > 100 ? '...' : '')
    };

    setUploads(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        texts: [...prev[activeTab].texts, newText]
      }
    }));
    setTextInput('');
  };

  const removeItem = (type, id) => {
    setUploads(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [type]: prev[activeTab][type].filter(item => item.id !== id)
      }
    }));
  };

  const getTotalUploads = (tabId) => {
    const tabUploads = uploads[tabId];
    return tabUploads.pdfs.length + tabUploads.images.length + tabUploads.texts.length;
  };

  const getAllFiles = () => {
    const allFiles = [];
    Object.entries(uploads).forEach(([docType, docUploads]) => {
      docUploads.pdfs.forEach(item => {
        if (item.file) allFiles.push({ file: item.file, documentType: docType });
      });
      docUploads.images.forEach(item => {
        if (item.file) allFiles.push({ file: item.file, documentType: docType });
      });
    });
    return allFiles;
  };

  const handleSubmit = async () => {
    if (!formData.chartNumber.trim()) {
      setSubmitResult({ success: false, message: 'Chart Number is required.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const allFiles = getAllFiles();

      if (allFiles.length === 0) {
        setSubmitResult({ success: false, message: 'No files to process. Please upload at least one document.' });
        setIsSubmitting(false);
        return;
      }

      const filesByType = {};
      allFiles.forEach(({ file, documentType }) => {
        if (!filesByType[documentType]) filesByType[documentType] = [];
        filesByType[documentType].push(file);
      });

      const results = [];

      for (const [documentType, files] of Object.entries(filesByType)) {
        const formDataToSend = new FormData();
        files.forEach(file => formDataToSend.append('files', file));
        formDataToSend.append('documentType', documentType);
        formDataToSend.append('mrn', formData.mrn);
        formDataToSend.append('chartNumber', formData.chartNumber);
        formDataToSend.append('facility', formData.facility);
        formDataToSend.append('specialty', formData.specialty);
        formDataToSend.append('dateOfService', formData.dateOfService);
        formDataToSend.append('provider', formData.provider);

        const response = await fetch(`${API_BASE_URL}/documents/process`, {
          method: 'POST',
          body: formDataToSend
        });

        const data = await response.json();
        results.push({ documentType, ...data });
      }

      const allSuccess = results.every(r => r.success);

      setSubmitResult({
        success: allSuccess,
        message: allSuccess
          ? `Successfully processed ${allFiles.length} document(s)! Redirecting to Work Queue...`
          : 'Some documents failed to process.',
        details: results
      });

      if (allSuccess) {
        setUploads({
          'ed-notes': { pdfs: [], images: [], texts: [] },
          'labs': { pdfs: [], images: [], texts: [] },
          'radiology': { pdfs: [], images: [], texts: [] },
          'discharge': { pdfs: [], images: [], texts: [] }
        });

        // Navigate to work queue after success
        setTimeout(() => {
          navigate('/work-queue');
        }, 2000);
      }
    } catch (error) {
      setSubmitResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAll = () => {
    setUploads({
      'ed-notes': { pdfs: [], images: [], texts: [] },
      'labs': { pdfs: [], images: [], texts: [] },
      'radiology': { pdfs: [], images: [], texts: [] },
      'discharge': { pdfs: [], images: [], texts: [] }
    });
    setSubmitResult(null);
  };

  const currentUploads = uploads[activeTab];
  const currentTab = tabs.find(t => t.id === activeTab);
  const totalFilesCount = Object.values(uploads).reduce((acc, u) => acc + u.pdfs.length + u.images.length, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Document Ingestion</h1>
            <p className="text-slate-500 text-sm mt-0.5">Upload clinical documents for AI-powered processing</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            AI Ready
          </span>
        </div>

        {/* Result Message */}
        {submitResult && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${submitResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            {submitResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />}
            <div>
              <p className={`font-medium ${submitResult.success ? 'text-emerald-800' : 'text-red-800'}`}>{submitResult.message}</p>
            </div>
            <button onClick={() => setSubmitResult(null)} className="ml-auto p-1 hover:bg-black/5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-2">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const uploadCount = getTotalUploads(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${isActive ? `${getTabColor(tab.id, 'bg')} text-white shadow-lg` : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {uploadCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : `${getTabColor(tab.id, 'light')} ${getTabColor(tab.id, 'text')}`}`}>
                      {uploadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className={`px-6 py-4 ${getTabColor(activeTab, 'light')} border-b ${getTabColor(activeTab, 'border')}`}>
            <div className="flex items-center gap-3">
              {React.createElement(currentTab.icon, { className: `w-5 h-5 ${getTabColor(activeTab, 'text')}` })}
              <div>
                <h2 className={`font-semibold ${getTabColor(activeTab, 'text')}`}>{currentTab.label} Upload</h2>
                <p className="text-sm text-slate-500">Add PDFs, images, or paste clinical text</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* PDF Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="font-medium text-slate-800 text-sm">PDF Documents</span>
                  </div>
                  {currentUploads.pdfs.length > 0 && <span className="text-xs text-slate-500">{currentUploads.pdfs.length} file(s)</span>}
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-red-300 hover:bg-red-50/30 ${dragActive.pdf ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}
                  onDragEnter={(e) => handleDrag(e, 'pdf', true)}
                  onDragLeave={(e) => handleDrag(e, 'pdf', false)}
                  onDragOver={(e) => handleDrag(e, 'pdf', true)}
                  onDrop={(e) => handleDrop(e, 'pdfs')}
                >
                  <input type="file" accept=".pdf" multiple onChange={(e) => handleFileInput(e, 'pdfs')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <File className="w-8 h-8 text-red-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Drop PDFs here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                </div>

                {currentUploads.pdfs.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {currentUploads.pdfs.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs text-slate-700 truncate flex-1">{file.name}</span>
                        <span className="text-xs text-slate-400">{file.size}</span>
                        <button onClick={() => removeItem('pdfs', file.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Image className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-800 text-sm">Images</span>
                  </div>
                  {currentUploads.images.length > 0 && <span className="text-xs text-slate-500">{currentUploads.images.length} file(s)</span>}
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 ${dragActive.image ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}
                  onDragEnter={(e) => handleDrag(e, 'image', true)}
                  onDragLeave={(e) => handleDrag(e, 'image', false)}
                  onDragOver={(e) => handleDrag(e, 'image', true)}
                  onDrop={(e) => handleDrop(e, 'images')}
                >
                  <input type="file" accept=".jpg,.jpeg,.png,.tiff,.webp" multiple onChange={(e) => handleFileInput(e, 'images')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <FileImage className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Drop images here</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, TIFF, WebP</p>
                </div>

                {currentUploads.images.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {currentUploads.images.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                        <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-slate-700 truncate flex-1">{file.name}</span>
                        <span className="text-xs text-slate-400">{file.size}</span>
                        <button onClick={() => removeItem('images', file.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Paste */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-medium text-slate-800 text-sm">Clinical Text</span>
                  </div>
                  {currentUploads.texts.length > 0 && <span className="text-xs text-slate-500">{currentUploads.texts.length} entry(s)</span>}
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 transition-all focus-within:border-emerald-400 focus-within:bg-emerald-50/20">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste clinical text here..."
                    className="w-full h-20 text-sm text-slate-700 placeholder-slate-400 bg-transparent resize-none outline-none"
                  />
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={addTextEntry}
                      disabled={!textInput.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Entry
                    </button>
                  </div>
                </div>

                {currentUploads.texts.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {currentUploads.texts.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg group">
                        <ClipboardPaste className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 flex-1 line-clamp-2">{entry.preview}</span>
                        <button onClick={() => removeItem('texts', entry.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Chart Information</h2>
              <p className="text-sm text-slate-500">Required information for processing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">MRN</label>
              <input
                type="text"
                placeholder="Medical Record Number"
                value={formData.mrn}
                onChange={(e) => setFormData(prev => ({ ...prev, mrn: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Chart Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Unique chart identifier"
                value={formData.chartNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, chartNumber: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Facility</label>
              <div className="relative">
                <select
                  value={formData.facility}
                  onChange={(e) => setFormData(prev => ({ ...prev, facility: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="">Select facility</option>
                  {facilities.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Specialty</label>
              <div className="relative">
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Date of Service</label>
              <input
                type="date"
                value={formData.dateOfService}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfService: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Provider Name</label>
              <input
                type="text"
                placeholder="Attending physician"
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Summary & Submit */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {tabs.map((tab) => {
                const count = getTotalUploads(tab.id);
                if (count === 0) return null;
                const Icon = tab.icon;
                return (
                  <div key={tab.id} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${getTabColor(tab.id, 'light')} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${getTabColor(tab.id, 'text')}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{tab.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{count} item(s)</p>
                    </div>
                  </div>
                );
              })}
              {totalFilesCount === 0 && <p className="text-sm text-slate-500">No documents added yet</p>}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearAll}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || totalFilesCount === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit for Processing
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentIngestion;
