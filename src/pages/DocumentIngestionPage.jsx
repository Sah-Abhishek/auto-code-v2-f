import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Image, ClipboardPaste, ChevronDown, Send, X, Plus,
  Stethoscope, FlaskConical, ScanLine, ClipboardCheck, FileImage, File,
  Loader2, CheckCircle2, AlertCircle, Layers, Trash2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

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

  // Uploads now stores grouped images
  const [uploads, setUploads] = useState({
    'ed-notes': { pdfs: [], imageGroups: [], texts: [] },
    'labs': { pdfs: [], imageGroups: [], texts: [] },
    'radiology': { pdfs: [], imageGroups: [], texts: [] },
    'discharge': { pdfs: [], imageGroups: [], texts: [] }
  });

  // Staging area for images before grouping
  const [stagedImages, setStagedImages] = useState([]);
  const [groupLabel, setGroupLabel] = useState('');

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
  const specialties = [
    'ED (Emergency Department)',
    'INO (Insurance)',
    'WHC (Women Health Care)',
    'SDS (Same Day Surgery)',
    'CLI (Clinic)',
    'Office',
    'IP (Inpatient)',
    'ED (Emergency Department)',
    'SDS (Same Day Surgery)',
    'IP (Inpatient)',
    'OP (Outpatient)',
    'LAB (Laboratory)',
    'RAD (Radiology)',
    'EDITS (Edits)',
    'ANALYSIS (Analysis)',
    'TRP (Trip)',
    'TRN (Transaction)',
    'TC (Treatment Code)',
    'TRPCL (Trip Claim)'
  ];

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

    if (type === 'pdfs') {
      handlePdfUpload(files);
    } else if (type === 'images') {
      handleImageStaging(files);
    }
  };

  // Handle PDF uploads (direct, no grouping needed)
  const handlePdfUpload = (files) => {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    const newFiles = pdfFiles.map((file, idx) => ({
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
        pdfs: [...prev[activeTab].pdfs, ...newFiles]
      }
    }));
  };

  // Stage images for grouping (not added yet)
  const handleImageStaging = (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newImages = imageFiles.map((file, idx) => ({
      id: Date.now() + idx + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setStagedImages(prev => [...prev, ...newImages]);
  };

  const handleFileInput = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'pdfs') {
      handlePdfUpload(files);
    } else if (type === 'images') {
      handleImageStaging(files);
    }
    e.target.value = '';
  };

  // Remove a staged image before grouping
  const removeStagedImage = (id) => {
    setStagedImages(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  // Add staged images as a group
  const addImageGroup = () => {
    if (stagedImages.length === 0) return;

    const newGroup = {
      id: Date.now(),
      label: groupLabel.trim() || `Document ${uploads[activeTab].imageGroups.length + 1}`,
      images: stagedImages.map(img => ({
        id: img.id,
        name: img.name,
        size: img.size,
        type: img.type,
        file: img.file,
        preview: img.preview
      })),
      totalSize: stagedImages.reduce((acc, img) => acc + img.file.size, 0)
    };

    setUploads(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        imageGroups: [...prev[activeTab].imageGroups, newGroup]
      }
    }));

    // Clear staging area
    setStagedImages([]);
    setGroupLabel('');
  };

  // Remove an entire image group
  const removeImageGroup = (groupId) => {
    setUploads(prev => {
      const group = prev[activeTab].imageGroups.find(g => g.id === groupId);
      // Revoke object URLs
      group?.images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });

      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          imageGroups: prev[activeTab].imageGroups.filter(g => g.id !== groupId)
        }
      };
    });
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
    const imageCount = tabUploads.imageGroups.reduce((acc, g) => acc + g.images.length, 0);
    return tabUploads.pdfs.length + imageCount + tabUploads.texts.length;
  };

  const getGroupCount = (tabId) => {
    const tabUploads = uploads[tabId];
    return tabUploads.pdfs.length + tabUploads.imageGroups.length + tabUploads.texts.length;
  };

  // Get total transactions (1 PDF = 1 txn, 1 image group = 1 txn)
  const getTotalTransactions = () => {
    let count = 0;
    Object.values(uploads).forEach(tabUploads => {
      count += tabUploads.pdfs.length; // Each PDF is 1 transaction
      count += tabUploads.imageGroups.length; // Each image group is 1 transaction
    });
    return count;
  };

  /**
   * Build files and transaction metadata for upload
   * Returns: { files: File[], transactions: TransactionMeta[] }
   */
  const buildUploadData = (docType, docUploads) => {
    const files = [];
    const transactions = [];
    let fileIndex = 0;

    // Add PDFs - each PDF is its own transaction
    docUploads.pdfs.forEach(pdf => {
      if (pdf.file) {
        files.push(pdf.file);
        transactions.push({
          type: 'pdf',
          fileIndex: fileIndex,
          label: pdf.name
        });
        fileIndex++;
      }
    });

    // Add image groups - each group shares a transaction
    docUploads.imageGroups.forEach(group => {
      const groupFileIndices = [];
      group.images.forEach(img => {
        if (img.file) {
          files.push(img.file);
          groupFileIndices.push(fileIndex);
          fileIndex++;
        }
      });
      if (groupFileIndices.length > 0) {
        transactions.push({
          type: 'image_group',
          fileIndices: groupFileIndices,
          label: group.label
        });
      }
    });

    return { files, transactions };
  };

  const handleSubmit = async () => {
    if (!formData.chartNumber.trim()) {
      setSubmitResult({ success: false, message: 'Chart Number is required.' });
      return;
    }

    // Check for staged images that haven't been grouped
    if (stagedImages.length > 0) {
      setSubmitResult({
        success: false,
        message: 'You have staged images that haven\'t been added as a group. Please click "Add Group" or remove them before submitting.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const results = [];
      let totalFiles = 0;
      let totalTransactions = 0;

      // Process each document type separately
      for (const [documentType, docUploads] of Object.entries(uploads)) {
        const { files, transactions } = buildUploadData(documentType, docUploads);

        if (files.length === 0) continue;

        const formDataToSend = new FormData();
        files.forEach(file => formDataToSend.append('files', file));
        formDataToSend.append('documentType', documentType);
        formDataToSend.append('mrn', formData.mrn);
        formDataToSend.append('chartNumber', formData.chartNumber);
        formDataToSend.append('facility', formData.facility);
        formDataToSend.append('specialty', formData.specialty);
        formDataToSend.append('dateOfService', formData.dateOfService);
        formDataToSend.append('provider', formData.provider);
        // Include transaction metadata
        formDataToSend.append('transactions', JSON.stringify(transactions));

        const response = await fetch(`${API_BASE_URL}/documents/process`, {
          method: 'POST',
          body: formDataToSend
        });

        const data = await response.json();
        results.push({ documentType, ...data });

        totalFiles += files.length;
        totalTransactions += transactions.length;
      }

      if (results.length === 0) {
        setSubmitResult({ success: false, message: 'No files to process. Please upload at least one document.' });
        setIsSubmitting(false);
        return;
      }

      const allSuccess = results.every(r => r.success);

      setSubmitResult({
        success: allSuccess,
        message: allSuccess
          ? `Successfully processed ${totalFiles} file(s) in ${totalTransactions} transaction(s)! Redirecting to Work Queue...`
          : 'Some documents failed to process.',
        details: results
      });

      if (allSuccess) {
        // Cleanup object URLs
        Object.values(uploads).forEach(tabUploads => {
          tabUploads.imageGroups.forEach(group => {
            group.images.forEach(img => {
              if (img.preview) URL.revokeObjectURL(img.preview);
            });
          });
        });

        setUploads({
          'ed-notes': { pdfs: [], imageGroups: [], texts: [] },
          'labs': { pdfs: [], imageGroups: [], texts: [] },
          'radiology': { pdfs: [], imageGroups: [], texts: [] },
          'discharge': { pdfs: [], imageGroups: [], texts: [] }
        });

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
    // Cleanup object URLs
    stagedImages.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    Object.values(uploads).forEach(tabUploads => {
      tabUploads.imageGroups.forEach(group => {
        group.images.forEach(img => {
          if (img.preview) URL.revokeObjectURL(img.preview);
        });
      });
    });

    setStagedImages([]);
    setGroupLabel('');
    setUploads({
      'ed-notes': { pdfs: [], imageGroups: [], texts: [] },
      'labs': { pdfs: [], imageGroups: [], texts: [] },
      'radiology': { pdfs: [], imageGroups: [], texts: [] },
      'discharge': { pdfs: [], imageGroups: [], texts: [] }
    });
    setSubmitResult(null);
  };

  const currentUploads = uploads[activeTab];
  const currentTab = tabs.find(t => t.id === activeTab);
  const totalFilesCount = Object.values(uploads).reduce((acc, u) => {
    const imageCount = u.imageGroups.reduce((a, g) => a + g.images.length, 0);
    return acc + u.pdfs.length + imageCount;
  }, 0);
  const totalTransactionsCount = getTotalTransactions();

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
              const uploadCount = getGroupCount(tab.id);

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
                <p className="text-sm text-slate-500">Add PDFs, grouped images, or paste clinical text</p>
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
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

              {/* Image Upload with Grouping */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-800 text-sm">Image Groups</span>
                  </div>
                  {currentUploads.imageGroups.length > 0 && (
                    <span className="text-xs text-slate-500">{currentUploads.imageGroups.length} group(s)</span>
                  )}
                </div>

                {/* Staging Area */}
                <div className={`border-2 rounded-xl transition-all ${stagedImages.length > 0 ? 'border-blue-300 bg-blue-50/30' : 'border-dashed border-slate-200'}`}>
                  {/* Drop Zone */}
                  <div
                    className={`relative p-4 text-center transition-all cursor-pointer hover:bg-blue-50/50 ${dragActive.image ? 'bg-blue-50/50' : ''}`}
                    onDragEnter={(e) => handleDrag(e, 'image', true)}
                    onDragLeave={(e) => handleDrag(e, 'image', false)}
                    onDragOver={(e) => handleDrag(e, 'image', true)}
                    onDrop={(e) => handleDrop(e, 'images')}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.tiff,.webp"
                      multiple
                      onChange={(e) => handleFileInput(e, 'images')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileImage className="w-6 h-6 text-blue-300 mx-auto mb-1" />
                    <p className="text-sm text-slate-600 font-medium">
                      {stagedImages.length > 0 ? 'Add more images' : 'Drop images here'}
                    </p>
                    <p className="text-xs text-slate-400">Multi-page documents</p>
                  </div>

                  {/* Staged Images Preview */}
                  {stagedImages.length > 0 && (
                    <div className="border-t border-blue-200 p-3 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Staging: {stagedImages.length} image(s)</span>
                      </div>

                      {/* Thumbnail Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {stagedImages.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.preview}
                              alt={img.name}
                              className="w-full h-14 object-cover rounded-lg border border-blue-200"
                            />
                            <button
                              onClick={() => removeStagedImage(img.id)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Group Label & Add Button */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Group label (optional)"
                          value={groupLabel}
                          onChange={(e) => setGroupLabel(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                          onClick={addImageGroup}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Group
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Added Image Groups */}
                {currentUploads.imageGroups.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {currentUploads.imageGroups.map((group) => (
                      <div key={group.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-800">{group.label}</span>
                          </div>
                          <button
                            onClick={() => removeImageGroup(group.id)}
                            className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {group.images.slice(0, 4).map((img, idx) => (
                            <img
                              key={img.id}
                              src={img.preview}
                              alt={img.name}
                              className="w-10 h-10 object-cover rounded-md border border-blue-200"
                            />
                          ))}
                          {group.images.length > 4 && (
                            <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                              +{group.images.length - 4}
                            </div>
                          )}
                          <span className="ml-auto text-xs text-slate-500">
                            {group.images.length} page(s) • {(group.totalSize / 1024).toFixed(0)} KB
                          </span>
                        </div>
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
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
              <label className="block text-sm font-medium text-slate-700">Practitioner</label>
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
                const count = getGroupCount(tab.id);
                const fileCount = getTotalUploads(tab.id);
                if (count === 0) return null;
                const Icon = tab.icon;
                return (
                  <div key={tab.id} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${getTabColor(tab.id, 'light')} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${getTabColor(tab.id, 'text')}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{tab.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{count} txn • {fileCount} file(s)</p>
                    </div>
                  </div>
                );
              })}
              {totalFilesCount === 0 && <p className="text-sm text-slate-500">No documents added yet</p>}
            </div>

            <div className="flex items-center gap-3">
              {stagedImages.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">{stagedImages.length} staged image(s)</span>
                </div>
              )}
              {totalTransactionsCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">{totalTransactionsCount} transaction(s)</span>
                </div>
              )}
              <button
                onClick={clearAll}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || totalFilesCount === 0 || stagedImages.length > 0}
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
