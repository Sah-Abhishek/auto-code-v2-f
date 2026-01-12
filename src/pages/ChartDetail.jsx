import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, AlertTriangle, Clock, Search,
  Check, X, Edit3, RotateCcw, Plus, ChevronLeft,
  ChevronRight, Loader2, Info, Stethoscope, FlaskConical, ScanLine,
  ClipboardCheck, ExternalLink, Eye, FileImage, Activity, Hash,
  AlertCircle, MessageSquare, Lightbulb, ShieldAlert, Save, Send,
  ChevronDown, FileCheck, Heart, Pill, Thermometer, User, Calendar,
  MapPin, Building, UserCheck, ClipboardList, Zap, Bell
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

// Feedback/Reason options by category - EXACT original values
const FEEDBACK_REASONS = {
  'ed-em': [
    'Upcoded',
    'Downcoded',
    'Missed LOC',
    'Wrong Category',
    'Inclusive Service',
    'Client Guideline Not Followed',
    'Invalid / Conflicting Documentation',
    'Time Component',
    'Payer Policy Not Followed',
    'Incorrect Revenue / Charge Capture / Mapping'
  ],
  'procedures': [
    'Service Not Documented Clearly',
    'Procedure Not Captured in Coding',
    'Documentation Insufficient for Code Selection',
    'Wrong Code Selection (Misinterpretation)',
    'Incorrect Units / Quantity',
    'Incorrect Administration Code Selection',
    'Inclusive Service Billed Separately',
    'Missing Required Report / Study',
    'Payer / Client Guideline Not Followed',
    'Laterality Not Applied',
    'Status Code Not Applied',
    'Payer/Client Guideline Not Followed',
    'Condition Resolved / Not Addressed',
    'Failed Medical Necessity',
    'NCD Non-Compliance',
    'LCD Non-Compliance',
    'MUE Edit Failure',
    'CCI Edit Conflict',
    'Payer Medical Policy Edit',
    'DX Not Supporting',
    'Invalid DX for Age/Gender',
    'Non Covered Diagnosis',
    'Status Code',
    'External Cause code'
  ],
  'primary-dx': [
    'Documentation Does Not Support Diagnosis',
    'Diagnosis Not Coded',
    'Incomplete Review of All Clinical Sources',
    'ICD Guideline Not Followed',
    'Incorrect Sequencing',
    'Signs/Symptoms Used Instead of Definitive Diagnosis',
    'Specificity Not Achieved',
    'Combination Code Not Used',
    'Laterality Not Applied',
    'Status Code Not Applied',
    'Payer/Client Guideline Not Followed',
    'Condition Resolved / Not Addressed',
    'Failed Medical Necessity',
    'NCD Non-Compliance',
    'LCD Non-Compliance',
    'MUE Edit Failure',
    'CCI Edit Conflict',
    'Payer Medical Policy Edit',
    'DX Not Supporting',
    'Invalid DX for Age/Gender',
    'Non Covered Diagnosis',
    'Status Code',
    'External Cause code'
  ],
  'secondary-dx': [
    'Documentation Does Not Support Diagnosis',
    'Diagnosis Not Coded',
    'Incomplete Review of All Clinical Sources',
    'ICD Guideline Not Followed',
    'Incorrect Sequencing',
    'Signs/Symptoms Used Instead of Definitive Diagnosis',
    'Specificity Not Achieved',
    'Combination Code Not Used',
    'Laterality Not Applied',
    'Status Code Not Applied',
    'Payer/Client Guideline Not Followed',
    'Condition Resolved / Not Addressed',
    'Failed Medical Necessity',
    'NCD Non-Compliance',
    'LCD Non-Compliance',
    'MUE Edit Failure',
    'CCI Edit Conflict',
    'Payer Medical Policy Edit',
    'DX Not Supporting',
    'Invalid DX for Age/Gender',
    'Non Covered Diagnosis',
    'Status Code',
    'External Cause code'
  ],
  'modifiers': [
    'Invalid Modifier',
    'Missing Modifier',
    'Incorrect Modifier',
    'Laterality Modifier',
    'Bilateral Modifier',
    'Repeat Service Modifier',
    'Multiple Procedure Modifier',
    'Global Period Modifier',
    'Distinct Procedure Modifier',
    'Surgical Modifier',
    'HCPCS Modifier',
    'CCI Edit Modifier',
    'Payer Specific Modifier',
    'Unsupported Documentation Modifier',
    'Overlapping Service Modifier'
  ],
  'reason-for-admit': [
    'Documentation Does Not Support Reason',
    'Incorrect Principal Reason',
    'Missing Admission Criteria',
    'Wrong Category Selection',
    'Incomplete Clinical Picture'
  ],
  'feedback': [
    'Coding Error',
    'Documentation Error',
    'Provider Error',
    'Payer Policy Error',
    'Medical Necessity Error',
    'Editing / Compliance Error',
    'Charge Capture Error',
    'Guideline Adherence Error',
    'Education / Training Error',
    'Process / Workflow Error',
    'Education Error'
  ]
};

// Map internal category names to dropdown keys
const CATEGORY_TO_DROPDOWN_KEY = {
  'reason_for_admit': 'reason-for-admit',
  'ed_em_level': 'ed-em',
  'procedures': 'procedures',
  'primary_diagnosis': 'primary-dx',
  'secondary_diagnoses': 'secondary-dx',
  'modifiers': 'modifiers'
};

// Styled Dropdown Component
const StyledSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 text-left bg-white border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${isOpen
          ? 'border-blue-500 ring-4 ring-blue-100'
          : value
            ? 'border-slate-300 hover:border-slate-400'
            : 'border-slate-200 hover:border-slate-300'
          }`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption || placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-auto">
          <div className="p-1">
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left rounded-lg transition-colors text-sm ${value === option
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Edit/Add Modal Component
const CodeEditModal = ({ isOpen, onClose, onSave, category, code, isNew, originalCode }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [comment, setComment] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewCode(code?.code || code?.icd_10_code || code?.cpt_code || code?.modifier_code || '');
      setNewDescription(code?.description || code?.procedure_name || code?.modifier_name || '');
      setSelectedReason('');
      setComment('');
    }
  }, [isOpen, code]);

  // Map category to dropdown key and get reasons
  const dropdownKey = CATEGORY_TO_DROPDOWN_KEY[category] || category;
  const reasons = FEEDBACK_REASONS[dropdownKey] || [];

  const getCategoryLabel = () => {
    switch (category) {
      case 'reason_for_admit': return 'Reason for Admit';
      case 'ed_em_level': return 'ED/EM Level';
      case 'procedures': return 'Procedure';
      case 'primary_diagnosis': return 'Primary Diagnosis';
      case 'secondary_diagnoses': return 'Secondary Diagnosis';
      case 'modifiers': return 'Modifier';
      default: return 'Code';
    }
  };

  const handleSave = () => {
    onSave({
      code: newCode,
      description: newDescription,
      reason: selectedReason,
      comment: comment,
      category: category,
      original: originalCode || code
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-slate-900">
            {isNew ? `Add ${getCategoryLabel()}` : `Edit ${getCategoryLabel()}`}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Show original code if modifying */}
          {!isNew && originalCode && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Original AI Code</p>
              <p className="text-sm font-mono text-slate-700">
                <span className="font-bold text-slate-900">
                  {originalCode.code || originalCode.icd_10_code || originalCode.cpt_code || originalCode.modifier_code}
                </span>
                {' — '}
                {originalCode.description || originalCode.procedure_name || originalCode.modifier_name}
              </p>
            </div>
          )}

          {/* Code Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {category === 'modifiers' ? 'Modifier Code' :
                category === 'procedures' ? 'CPT Code' :
                  category === 'ed_em_level' ? 'E/M Code' : 'ICD-10 Code'}
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg font-mono"
              placeholder={category === 'modifiers' ? '25' :
                category === 'procedures' ? '45378' :
                  category === 'ed_em_level' ? '99283' : 'Z12.11'}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              placeholder="Enter description"
            />
          </div>

          {/* Reason Dropdown - Styled */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for {isNew ? 'Adding' : 'Change'} <span className="text-red-500">*</span>
            </label>
            <StyledSelect
              value={selectedReason}
              onChange={setSelectedReason}
              options={reasons}
              placeholder="Select a reason..."
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
              placeholder="Add any additional comments..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedReason || !newCode}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-200"
          >
            {isNew ? 'Add Code' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Review Modal Component - Shows final codes before submission
const ReviewModal = ({ isOpen, onClose, onSubmit, workingCodes, submitting }) => {
  if (!isOpen) return null;

  const getFinalCodes = (codes) => {
    return (codes || []).filter(c => c.status !== 'rejected');
  };

  const getRejectedCodes = (codes) => {
    return (codes || []).filter(c => c.status === 'rejected');
  };

  const categories = [
    { key: 'reason_for_admit', title: 'Reason for Admit', color: 'red', getCode: c => c.icd_10_code, getDesc: c => c.description },
    { key: 'primary_diagnosis', title: 'Primary Diagnosis', color: 'emerald', getCode: c => c.icd_10_code, getDesc: c => c.description },
    { key: 'secondary_diagnoses', title: 'Secondary Diagnoses', color: 'amber', getCode: c => c.icd_10_code, getDesc: c => c.description },
    { key: 'procedures', title: 'Procedures (CPT)', color: 'purple', getCode: c => c.cpt_code, getDesc: c => c.procedure_name || c.description },
    { key: 'ed_em_level', title: 'ED/EM Level', color: 'blue', getCode: c => c.code, getDesc: c => c.description },
    { key: 'modifiers', title: 'Modifiers', color: 'slate', getCode: c => c.modifier_code, getDesc: c => c.modifier_name }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  const totalFinal = categories.reduce((sum, cat) => sum + getFinalCodes(workingCodes[cat.key]).length, 0);
  const totalRejected = categories.reduce((sum, cat) => sum + getRejectedCodes(workingCodes[cat.key]).length, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <FileCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Review & Submit</h3>
                <p className="text-sm text-slate-500">Review final codes before submission</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{totalFinal}</span> codes to submit
            </span>
          </div>
          {totalRejected > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{totalRejected}</span> rejected
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.map(({ key, title, color, getCode, getDesc }) => {
            const finalCodes = getFinalCodes(workingCodes[key]);
            const rejectedCodes = getRejectedCodes(workingCodes[key]);

            if (finalCodes.length === 0 && rejectedCodes.length === 0) return null;

            return (
              <div key={key}>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${color}-500`}></div>
                  {title}
                  <span className="text-slate-400 font-normal">({finalCodes.length})</span>
                </h4>

                <div className="space-y-2">
                  {/* Final codes */}
                  {finalCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className={`px-4 py-3 rounded-xl border-2 ${colorClasses[color]}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold font-mono">{getCode(code)}</span>
                          <span className="text-slate-600">{getDesc(code)}</span>
                        </div>
                        {code.status === 'modified' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">Modified</span>
                        )}
                        {code.status === 'added' && (
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">Added</span>
                        )}
                      </div>
                      {/* Show reason in review modal too */}
                      {code.changeReason && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold">Reason:</span> {code.changeReason}
                          </p>
                          {code.changeComment && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span className="font-semibold">Comment:</span> {code.changeComment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Rejected codes */}
                  {rejectedCodes.map((code, idx) => (
                    <div
                      key={`rejected-${idx}`}
                      className="px-4 py-3 rounded-xl border-2 border-red-300 bg-red-50 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-red-400 line-through">{getCode(code)}</span>
                        <span className="text-red-400 line-through">{getDesc(code)}</span>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Rejected</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Make sure all codes are correct before submitting
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-medium"
            >
              Go Back
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit to NextCode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartDetail = () => {
  const { chartNumber } = useParams();
  const navigate = useNavigate();
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  const feedbackDropdownRef = useRef(null);

  // Close feedback dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (feedbackDropdownRef.current && !feedbackDropdownRef.current.contains(event.target)) {
        setShowFeedbackDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Document viewer state
  const [activeDocType, setActiveDocType] = useState('all');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [viewMode, setViewMode] = useState('pdf');

  // Working codes state - tracks current state with modifications
  const [workingCodes, setWorkingCodes] = useState({
    reason_for_admit: [],
    ed_em_level: [],
    procedures: [],
    primary_diagnosis: [],
    secondary_diagnoses: [],
    modifiers: []
  });

  // Modifications tracking
  const [modifications, setModifications] = useState({
    reason_for_admit: [],
    ed_em_level: [],
    procedures: [],
    primary_diagnosis: [],
    secondary_diagnoses: [],
    modifiers: []
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    category: null,
    code: null,
    originalCode: null,
    isNew: false,
    codeIndex: null
  });

  const docTypeTabs = [
    { id: 'all', label: 'All Docs', icon: FileText },
    { id: 'ed-notes', label: 'ED Notes', icon: Stethoscope },
    { id: 'labs', label: 'Labs', icon: FlaskConical },
    { id: 'radiology', label: 'Radiology', icon: ScanLine },
    { id: 'discharge', label: 'Discharge', icon: ClipboardCheck }
  ];

  // Check if chart is submitted (read-only mode)
  const isReadOnly = chart?.reviewStatus === 'submitted';

  // Initialize working codes from chart data - DEFAULT TO ACCEPTED
  useEffect(() => {
    if (chart) {
      const diagCodes = chart.diagnosisCodes || {};
      const originalCodes = chart.originalAICodes || {};

      // Helper to set default status to 'accepted'
      const setDefaultAccepted = (codes) => {
        if (!Array.isArray(codes)) return [];
        return codes.map(code => ({
          ...code,
          status: code.status || 'accepted' // Default to accepted
        }));
      };

      setWorkingCodes({
        reason_for_admit: setDefaultAccepted(diagCodes.reason_for_admit || originalCodes.reason_for_admit || []),
        ed_em_level: setDefaultAccepted(diagCodes.ed_em_level || originalCodes.ed_em_level || []),
        procedures: setDefaultAccepted(chart.procedures || originalCodes.procedures || []),
        primary_diagnosis: setDefaultAccepted(diagCodes.primary_diagnosis || originalCodes.primary_diagnosis || []),
        secondary_diagnoses: setDefaultAccepted(diagCodes.secondary_diagnoses || originalCodes.secondary_diagnoses || []),
        modifiers: setDefaultAccepted(diagCodes.modifiers || originalCodes.modifiers || [])
      });

      // Load existing modifications if any
      if (chart.userModifications) {
        setModifications(chart.userModifications);
      }
    }
  }, [chart]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/charts/${chartNumber}`);
        const data = await response.json();

        if (data.success) {
          setChart(data.chart);
        } else {
          setError(data.error || 'Chart not found');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, [chartNumber]);

  // Handle code modification
  const handleCodeModify = (category, index, originalCode) => {
    if (isReadOnly) return;
    const code = workingCodes[category]?.[index];
    setModalState({
      isOpen: true,
      category,
      code,
      originalCode: originalCode || code,
      isNew: false,
      codeIndex: index
    });
  };

  // Handle add new code
  const handleAddCode = (category) => {
    if (isReadOnly) return;
    setModalState({
      isOpen: true,
      category,
      code: null,
      originalCode: null,
      isNew: true,
      codeIndex: null
    });
  };

  // Handle modal save - UPDATED to store reason on code object
  const handleModalSave = (data) => {
    const { category, code, description, reason, comment, original } = data;
    const timestamp = new Date().toISOString();

    if (modalState.isNew) {
      // Adding new code
      const newCode = buildCodeObject(category, code, description);
      newCode.status = 'added';
      newCode.isUserAdded = true;
      newCode.changeReason = reason;
      newCode.changeComment = comment;
      newCode.changedAt = timestamp;

      setWorkingCodes(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), newCode]
      }));

      setModifications(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), {
          action: 'added',
          added: newCode,
          reason,
          comment,
          timestamp
        }]
      }));
    } else {
      // Modifying existing code
      const modifiedCode = buildCodeObject(category, code, description);
      modifiedCode.status = 'modified';
      modifiedCode.isModified = true;
      modifiedCode.originalCode = original;
      modifiedCode.changeReason = reason;
      modifiedCode.changeComment = comment;
      modifiedCode.changedAt = timestamp;

      setWorkingCodes(prev => {
        const updated = [...(prev[category] || [])];
        updated[modalState.codeIndex] = modifiedCode;
        return { ...prev, [category]: updated };
      });

      setModifications(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), {
          action: 'modified',
          original,
          modified: modifiedCode,
          reason,
          comment,
          timestamp
        }]
      }));
    }
  };

  // Build code object based on category
  const buildCodeObject = (category, code, description) => {
    switch (category) {
      case 'ed_em_level':
        return { code, description, confidence: 'high' };
      case 'procedures':
        return { cpt_code: code, procedure_name: description, confidence: 'high' };
      case 'reason_for_admit':
      case 'primary_diagnosis':
      case 'secondary_diagnoses':
        return { icd_10_code: code, description, confidence: 'high' };
      case 'modifiers':
        return { modifier_code: code, modifier_name: description, confidence: 'high' };
      default:
        return { code, description };
    }
  };

  // Handle code accept
  const handleCodeAccept = (category, index) => {
    if (isReadOnly) return;
    setWorkingCodes(prev => {
      const updated = [...(prev[category] || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], status: 'accepted' };
      }
      return { ...prev, [category]: updated };
    });
  };

  // Handle code reject
  const handleCodeReject = (category, index) => {
    if (isReadOnly) return;
    const code = workingCodes[category]?.[index];

    setWorkingCodes(prev => {
      const updated = [...(prev[category] || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], status: 'rejected' };
      }
      return { ...prev, [category]: updated };
    });

    setModifications(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), {
        action: 'rejected',
        rejected: code,
        timestamp: new Date().toISOString()
      }]
    }));
  };

  // Handle code reset - resets to accepted (default)
  const handleCodeReset = (category, index) => {
    if (isReadOnly) return;
    const originalCodes = chart?.originalAICodes || {};
    const originalCode = originalCodes[category]?.[index];

    if (originalCode) {
      setWorkingCodes(prev => {
        const updated = [...(prev[category] || [])];
        updated[index] = { ...originalCode, status: 'accepted' }; // Reset to accepted
        return { ...prev, [category]: updated };
      });
    }
  };

  // Open review modal
  const handleReviewClick = () => {
    setShowReviewModal(true);
  };

  // Submit to NextCode
  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Build final codes (excluding rejected)
      const finalCodes = {
        reason_for_admit: workingCodes.reason_for_admit.filter(c => c.status !== 'rejected'),
        ed_em_level: workingCodes.ed_em_level.filter(c => c.status !== 'rejected'),
        procedures: workingCodes.procedures.filter(c => c.status !== 'rejected'),
        primary_diagnosis: workingCodes.primary_diagnosis.filter(c => c.status !== 'rejected'),
        secondary_diagnoses: workingCodes.secondary_diagnoses.filter(c => c.status !== 'rejected'),
        modifiers: workingCodes.modifiers.filter(c => c.status !== 'rejected')
      };

      const response = await fetch(`${API_BASE_URL}/charts/${chartNumber}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalCodes,
          modifications,
          submittedBy: 'user' // Could be actual user ID
        })
      });

      const data = await response.json();

      if (data.success) {
        setChart(prev => ({ ...prev, reviewStatus: 'submitted' }));
        setShowReviewModal(false);
        // Could show a success toast here
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit codes');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter documents
  const getFilteredDocuments = () => {
    if (!chart?.documents) return [];
    if (activeDocType === 'all') return chart.documents;
    return chart.documents.filter(doc => doc.documentType === activeDocType);
  };

  const getDocCountByType = (type) => {
    if (!chart?.documents) return 0;
    if (type === 'all') return chart.documents.length;
    return chart.documents.filter(doc => doc.documentType === type).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-600">{error}</p>
        <button
          onClick={() => navigate('/work-queue')}
          className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          Back to Work Queue
        </button>
      </div>
    );
  }

  const aiSummary = chart?.aiSummary || {};
  const codingNotes = chart?.codingNotes || {};
  const originalAICodes = chart?.originalAICodes || {};
  const filteredDocs = getFilteredDocuments();
  const currentDoc = filteredDocs[selectedDocIndex];

  const feedback = {
    documentation_gaps: codingNotes?.documentation_gaps || [],
    physician_queries_needed: codingNotes?.physician_queries_needed || [],
    coding_tips: codingNotes?.coding_tips || [],
    compliance_alerts: codingNotes?.compliance_alerts || []
  };

  // Calculate total feedback count for bell icon badge
  const totalFeedbackCount =
    feedback.documentation_gaps.length +
    feedback.physician_queries_needed.length +
    feedback.coding_tips.length +
    feedback.compliance_alerts.length;

  const isPDF = (doc) => doc?.mimeType === 'application/pdf' || doc?.filename?.toLowerCase().endsWith('.pdf');
  const isImage = (doc) => doc?.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|tiff)$/i.test(doc?.filename || '');

  // Check if there are any modifications
  const hasModifications = Object.values(modifications).some(arr => arr.length > 0);

  // Count rejected codes
  const rejectedCount = Object.values(workingCodes).reduce(
    (sum, codes) => sum + (codes || []).filter(c => c.status === 'rejected').length,
    0
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Edit Modal */}
      <CodeEditModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, category: null, code: null, originalCode: null, isNew: false, codeIndex: null })}
        onSave={handleModalSave}
        category={modalState.category}
        code={modalState.code}
        originalCode={modalState.originalCode}
        isNew={modalState.isNew}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmit}
        workingCodes={workingCodes}
        submitting={submitting}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/work-queue')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Chart Review - {chartNumber}</h1>
            <p className="text-sm text-slate-500">
              MRN: {chart?.mrn} | {chart?.facility} | {chart?.dateOfService ? new Date(chart.dateOfService).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && hasModifications && (
            <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
              Unsaved Changes
            </span>
          )}

          {!isReadOnly && rejectedCount > 0 && (
            <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
              {rejectedCount} Rejected
            </span>
          )}

          {/* Feedback Bell Icon */}
          {totalFeedbackCount > 0 && (
            <div className="relative" ref={feedbackDropdownRef}>
              <button
                onClick={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
                className={`relative p-2 rounded-lg transition-colors ${showFeedbackDropdown ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {totalFeedbackCount}
                </span>
              </button>

              {/* Feedback Dropdown */}
              {showFeedbackDropdown && (
                <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[70vh] overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-900">Coding Feedback</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        {totalFeedbackCount} items
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFeedbackDropdown(false)}
                      className="p-1 hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="overflow-y-auto flex-1 p-3 space-y-3">
                    {/* Documentation Gaps */}
                    {feedback.documentation_gaps?.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-slate-900 text-sm">Documentation Gaps</span>
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">{feedback.documentation_gaps.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {feedback.documentation_gaps.map((item, idx) => (
                            <div key={idx} className="p-3">
                              <p className="font-medium text-slate-900 text-sm">{item.gap || item}</p>
                              {item.impact && <p className="text-xs text-amber-600 mt-1">Impact: {item.impact}</p>}
                              {item.suggestion && <p className="text-xs text-slate-500 mt-1">Suggestion: {item.suggestion}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Physician Queries */}
                    {feedback.physician_queries_needed?.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-slate-900 text-sm">Physician Queries</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{feedback.physician_queries_needed.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {feedback.physician_queries_needed.map((item, idx) => (
                            <div key={idx} className="p-3">
                              <p className="font-medium text-slate-900 text-sm">{item.query || item}</p>
                              {item.reason && <p className="text-xs text-slate-500 mt-1">Reason: {item.reason}</p>}
                              {item.priority && (
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                  }`}>{item.priority} priority</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coding Tips */}
                    {feedback.coding_tips?.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-slate-900 text-sm">Coding Tips</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{feedback.coding_tips.length}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {feedback.coding_tips.map((item, idx) => (
                            <div key={idx} className="p-3">
                              <p className="font-medium text-slate-900 text-sm">{item.tip || item}</p>
                              {item.related_code && (
                                <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                                  Related: {item.related_code}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Alerts */}
                    {feedback.compliance_alerts?.length > 0 && (
                      <div className="bg-white rounded-xl border border-red-200">
                        <div className="px-3 py-2 border-b border-red-100 flex items-center gap-2 bg-red-50 rounded-t-xl">
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-red-900 text-sm">Compliance Alerts</span>
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">{feedback.compliance_alerts.length}</span>
                        </div>
                        <div className="divide-y divide-red-100">
                          {feedback.compliance_alerts.map((item, idx) => (
                            <div key={idx} className="p-3">
                              <p className="font-medium text-slate-900 text-sm">{item.alert || item}</p>
                              {item.severity && (
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${item.severity === 'high' ? 'bg-red-100 text-red-700' :
                                    item.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                  }`}>{item.severity} severity</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${chart?.reviewStatus === 'submitted' ? 'bg-emerald-100 text-emerald-700' :
            chart?.reviewStatus === 'in_review' ? 'bg-blue-100 text-blue-700' :
              'bg-amber-100 text-amber-700'
            }`}>
            {chart?.reviewStatus === 'pending' ? '◉ Pending Review' :
              chart?.reviewStatus === 'in_review' ? '◉ In Review' : '✓ Submitted'}
          </span>

          {!isReadOnly && (
            <button
              onClick={handleReviewClick}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              Review & Submit
            </button>
          )}
        </div>
      </header>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Documents */}
        <div className="w-[450px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Original Clinical Documents</h2>
            <p className="text-xs text-slate-500">(Source of Truth) - {chart?.documents?.length || 0} documents</p>
          </div>

          {/* Document Type Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {docTypeTabs.map((tab) => {
              const count = getDocCountByType(tab.id);
              const isActive = activeDocType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveDocType(tab.id); setSelectedDocIndex(0); }}
                  className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium transition-colors ${isActive ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'pdf' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Eye className="w-3 h-3 inline mr-1" />Document
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewMode === 'text' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <FileText className="w-3 h-3 inline mr-1" />OCR Text
              </button>
            </div>
            {currentDoc?.s3Url && (
              <a href={currentDoc.s3Url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />Open
              </a>
            )}
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentDoc ? (
              <>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="font-medium text-slate-900 text-sm truncate">{currentDoc.filename}</h3>
                  <p className="text-xs text-slate-500">Type: {currentDoc.documentType} | Size: {(currentDoc.fileSize / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex-1 overflow-auto">
                  {viewMode === 'pdf' && currentDoc.s3Url ? (
                    <div className="h-full">
                      {isPDF(currentDoc) ? (
                        <iframe src={currentDoc.s3Url} className="w-full h-full border-0" title={currentDoc.filename} />
                      ) : isImage(currentDoc) ? (
                        <div className="p-4 flex items-center justify-center h-full">
                          <img src={currentDoc.s3Url} alt={currentDoc.filename} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="p-4 text-center text-slate-500">
                          <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>Preview not available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4">
                      {currentDoc.ocrText ? (
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">{currentDoc.ocrText}</pre>
                      ) : (
                        <p className="text-slate-500 text-center py-8">No OCR text available</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No documents in this category</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Pagination */}
          {filteredDocs.length > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-white">
              <button onClick={() => setSelectedDocIndex(i => Math.max(0, i - 1))} disabled={selectedDocIndex === 0} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {filteredDocs.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocIndex(idx)}
                    className={`px-2 py-1 text-xs rounded ${idx === selectedDocIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setSelectedDocIndex(i => Math.min(filteredDocs.length - 1, i + 1))} disabled={selectedDocIndex === filteredDocs.length - 1} className="p-1.5 hover:bg-slate-100 rounded disabled:opacity-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Middle Column - AI Clinical Summary (Enhanced) */}
        <div className="w-[420px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">AI Clinical Summary</h2>
                <p className="text-xs text-slate-500">Comprehensive analysis from source documents</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-5">
            {/* Patient Demographics */}
            {(aiSummary.patient_demographics || chart?.mrn) && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Patient Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">MRN:</span>
                    <span className="font-medium text-slate-900">{chart?.mrn || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">DOS:</span>
                    <span className="font-medium text-slate-900">{chart?.dateOfService ? new Date(chart.dateOfService).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">Facility:</span>
                    <span className="font-medium text-slate-900">{chart?.facility || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">Provider:</span>
                    <span className="font-medium text-slate-900">{chart?.provider || aiSummary.attending_provider || 'N/A'}</span>
                  </div>
                  {aiSummary.patient_demographics?.age && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">Age/Sex:</span>
                      <span className="font-medium text-slate-900">
                        {aiSummary.patient_demographics.age} {aiSummary.patient_demographics.sex}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chief Complaint - Highlighted */}
            {aiSummary.chief_complaint && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-900 text-sm">Chief Complaint</h3>
                </div>
                <p className="text-slate-800 font-medium">
                  {typeof aiSummary.chief_complaint === 'string'
                    ? aiSummary.chief_complaint
                    : aiSummary.chief_complaint.text || JSON.stringify(aiSummary.chief_complaint)}
                </p>
                {typeof aiSummary.chief_complaint === 'object' && aiSummary.chief_complaint.evidence?.exact_text && (
                  <p className="text-xs text-amber-700 mt-2 italic border-l-2 border-amber-300 pl-2">
                    "{aiSummary.chief_complaint.evidence.exact_text}"
                  </p>
                )}
              </div>
            )}

            {/* History of Present Illness */}
            {aiSummary.history_of_present_illness && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">History of Present Illness</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {typeof aiSummary.history_of_present_illness === 'string'
                    ? aiSummary.history_of_present_illness
                    : aiSummary.history_of_present_illness.text || aiSummary.history_of_present_illness.narrative || JSON.stringify(aiSummary.history_of_present_illness)}
                </p>
                {typeof aiSummary.history_of_present_illness === 'object' && (aiSummary.history_of_present_illness.onset || aiSummary.history_of_present_illness.duration || aiSummary.history_of_present_illness.severity) && (
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    {aiSummary.history_of_present_illness.onset && <span>Onset: {aiSummary.history_of_present_illness.onset}</span>}
                    {aiSummary.history_of_present_illness.duration && <span>Duration: {aiSummary.history_of_present_illness.duration}</span>}
                    {aiSummary.history_of_present_illness.severity && <span>Severity: {aiSummary.history_of_present_illness.severity}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Vitals Summary */}
            {(chart?.vitalsSummary || aiSummary.vitals) && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-slate-900 text-sm">Vital Signs</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const vitals = chart?.vitalsSummary || aiSummary.vitals || {};
                    const formatVital = (val) => {
                      if (!val) return null;
                      if (typeof val === 'string' || typeof val === 'number') return val;
                      if (typeof val === 'object') {
                        // Handle object format - join values or return first value
                        if (val.value) return val.value;
                        if (val.systolic && val.diastolic) return `${val.systolic}/${val.diastolic}`;
                        return Object.values(val).filter(v => v !== null && v !== undefined).join(' / ');
                      }
                      return String(val);
                    };

                    const bp = formatVital(vitals.blood_pressure);
                    const hr = formatVital(vitals.heart_rate);
                    const temp = formatVital(vitals.temperature);
                    const spo2 = formatVital(vitals.oxygen_saturation);
                    const rr = formatVital(vitals.respiratory_rate);
                    const pain = formatVital(vitals.pain_score);

                    return (
                      <>
                        {bp && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                            <Heart className="w-4 h-4 text-red-500" />
                            <div>
                              <p className="text-xs text-slate-500">BP</p>
                              <p className="font-semibold text-slate-900">{bp}</p>
                            </div>
                          </div>
                        )}
                        {hr && (
                          <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                            <Activity className="w-4 h-4 text-pink-500" />
                            <div>
                              <p className="text-xs text-slate-500">HR</p>
                              <p className="font-semibold text-slate-900">{hr}</p>
                            </div>
                          </div>
                        )}
                        {temp && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-slate-500">Temp</p>
                              <p className="font-semibold text-slate-900">{temp}</p>
                            </div>
                          </div>
                        )}
                        {spo2 && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-slate-500">SpO2</p>
                              <p className="font-semibold text-slate-900">{spo2}</p>
                            </div>
                          </div>
                        )}
                        {rr && (
                          <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                            <Activity className="w-4 h-4 text-teal-500" />
                            <div>
                              <p className="text-xs text-slate-500">RR</p>
                              <p className="font-semibold text-slate-900">{rr}</p>
                            </div>
                          </div>
                        )}
                        {pain && (
                          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-xs text-slate-500">Pain</p>
                              <p className="font-semibold text-slate-900">{pain}</p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Physical Examination */}
            {aiSummary.physical_examination && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Physical Examination</h3>
                </div>
                {typeof aiSummary.physical_examination === 'string' ? (
                  <p className="text-sm text-slate-700">{aiSummary.physical_examination}</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(aiSummary.physical_examination).map(([system, finding]) => {
                      const findingText = typeof finding === 'object' ? JSON.stringify(finding) : String(finding || '');
                      return (
                        <div key={system} className="text-sm">
                          <span className="font-medium text-slate-800 capitalize">{system.replace(/_/g, ' ')}:</span>{' '}
                          <span className="text-slate-600">{findingText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Assessment & Plan */}
            {aiSummary.assessment_and_plan && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900 text-sm">Assessment & Plan</h3>
                </div>
                {typeof aiSummary.assessment_and_plan === 'string' ? (
                  <p className="text-sm text-slate-700">{aiSummary.assessment_and_plan}</p>
                ) : (
                  <div className="space-y-2">
                    {aiSummary.assessment_and_plan.assessment && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Assessment</p>
                        <p className="text-sm text-slate-700">
                          {typeof aiSummary.assessment_and_plan.assessment === 'object'
                            ? JSON.stringify(aiSummary.assessment_and_plan.assessment)
                            : aiSummary.assessment_and_plan.assessment}
                        </p>
                      </div>
                    )}
                    {aiSummary.assessment_and_plan.plan && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Plan</p>
                        <p className="text-sm text-slate-700">
                          {typeof aiSummary.assessment_and_plan.plan === 'object'
                            ? JSON.stringify(aiSummary.assessment_and_plan.plan)
                            : aiSummary.assessment_and_plan.plan}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline of Care */}
            {aiSummary.timeline_of_care?.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Visit Timeline</h3>
                </div>
                <div className="space-y-3">
                  {aiSummary.timeline_of_care.map((event, idx) => {
                    const eventTime = typeof event.time === 'object' ? JSON.stringify(event.time) : event.time;
                    const eventName = typeof event.event === 'object' ? JSON.stringify(event.event) : event.event;
                    const eventDesc = typeof event.description === 'object' ? JSON.stringify(event.description) : event.description;

                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          {idx < aiSummary.timeline_of_care.length - 1 && <div className="w-0.5 h-full bg-blue-200 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium text-slate-900 text-sm">{eventTime && `${eventTime} - `}{eventName}</p>
                          {eventDesc && <p className="text-xs text-slate-600">{eventDesc}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medications */}
            {chart?.medications?.length > 0 && (
              <MedicationsSection medications={chart.medications} />
            )}

            {/* Clinical Alerts */}
            {aiSummary.clinical_alerts?.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="font-semibold text-red-900 text-sm">Clinical Alerts</h3>
                </div>
                <div className="space-y-2">
                  {aiSummary.clinical_alerts.map((alert, idx) => {
                    const alertText = typeof alert === 'string' ? alert : (alert.alert || alert.message || alert.text || JSON.stringify(alert));
                    const severity = typeof alert === 'object' ? alert.severity : null;

                    return (
                      <div key={idx} className={`p-3 rounded-lg border ${severity === 'high' ? 'bg-red-100 border-red-300' :
                        severity === 'medium' ? 'bg-amber-100 border-amber-300' : 'bg-blue-100 border-blue-300'
                        }`}>
                        <p className={`font-medium text-sm ${severity === 'high' ? 'text-red-800' :
                          severity === 'medium' ? 'text-amber-800' : 'text-blue-800'
                          }`}>{alertText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Coding Categories (Reordered) */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-semibold text-slate-900">AI Coding Assistance</h2>
            <p className="text-xs text-slate-500">
              {isReadOnly ? '(View Only - Chart already submitted)' : '(All codes accepted by default - reject or modify as needed)'}
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* 1. Reason for Admit */}
            <CodeSection
              title="Reason for Admit"
              category="reason_for_admit"
              codes={workingCodes.reason_for_admit}
              originalCodes={originalAICodes.reason_for_admit}
              onAdd={() => handleAddCode('reason_for_admit')}
              onModify={(idx) => handleCodeModify('reason_for_admit', idx, originalAICodes.reason_for_admit?.[idx])}
              onAccept={(idx) => handleCodeAccept('reason_for_admit', idx)}
              onReject={(idx) => handleCodeReject('reason_for_admit', idx)}
              onReset={(idx) => handleCodeReset('reason_for_admit', idx)}
              accentColor="red"
              renderCode={(code) => code.icd_10_code}
              renderDescription={(code) => code.description}
              isReadOnly={isReadOnly}
            />

            {/* 2. Primary Diagnosis */}
            <CodeSection
              title="Primary Diagnosis"
              category="primary_diagnosis"
              codes={workingCodes.primary_diagnosis}
              originalCodes={originalAICodes.primary_diagnosis}
              onAdd={() => handleAddCode('primary_diagnosis')}
              onModify={(idx) => handleCodeModify('primary_diagnosis', idx, originalAICodes.primary_diagnosis?.[idx])}
              onAccept={(idx) => handleCodeAccept('primary_diagnosis', idx)}
              onReject={(idx) => handleCodeReject('primary_diagnosis', idx)}
              onReset={(idx) => handleCodeReset('primary_diagnosis', idx)}
              accentColor="emerald"
              renderCode={(code) => code.icd_10_code}
              renderDescription={(code) => code.description}
              isReadOnly={isReadOnly}
            />

            {/* 3. Secondary Diagnoses */}
            <CodeSection
              title="Secondary Diagnoses"
              category="secondary_diagnoses"
              codes={workingCodes.secondary_diagnoses}
              originalCodes={originalAICodes.secondary_diagnoses}
              onAdd={() => handleAddCode('secondary_diagnoses')}
              onModify={(idx) => handleCodeModify('secondary_diagnoses', idx, originalAICodes.secondary_diagnoses?.[idx])}
              onAccept={(idx) => handleCodeAccept('secondary_diagnoses', idx)}
              onReject={(idx) => handleCodeReject('secondary_diagnoses', idx)}
              onReset={(idx) => handleCodeReset('secondary_diagnoses', idx)}
              accentColor="amber"
              renderCode={(code) => code.icd_10_code}
              renderDescription={(code) => code.description}
              isReadOnly={isReadOnly}
            />

            {/* 4. Procedures (CPT) */}
            <CodeSection
              title="Procedures (CPT)"
              category="procedures"
              codes={workingCodes.procedures}
              originalCodes={originalAICodes.procedures}
              onAdd={() => handleAddCode('procedures')}
              onModify={(idx) => handleCodeModify('procedures', idx, originalAICodes.procedures?.[idx])}
              onAccept={(idx) => handleCodeAccept('procedures', idx)}
              onReject={(idx) => handleCodeReject('procedures', idx)}
              onReset={(idx) => handleCodeReset('procedures', idx)}
              accentColor="purple"
              renderCode={(code) => code.cpt_code}
              renderDescription={(code) => code.procedure_name || code.description}
              isReadOnly={isReadOnly}
            />

            {/* 5. ED/EM Level */}
            <CodeSection
              title="ED/EM Level"
              category="ed_em_level"
              codes={workingCodes.ed_em_level}
              originalCodes={originalAICodes.ed_em_level}
              onAdd={() => handleAddCode('ed_em_level')}
              onModify={(idx) => handleCodeModify('ed_em_level', idx, originalAICodes.ed_em_level?.[idx])}
              onAccept={(idx) => handleCodeAccept('ed_em_level', idx)}
              onReject={(idx) => handleCodeReject('ed_em_level', idx)}
              onReset={(idx) => handleCodeReset('ed_em_level', idx)}
              accentColor="blue"
              renderCode={(code) => code.code}
              renderDescription={(code) => code.description}
              isReadOnly={isReadOnly}
            />

            {/* 6. Modifiers */}
            <CodeSection
              title="Modifiers"
              category="modifiers"
              codes={workingCodes.modifiers}
              originalCodes={originalAICodes.modifiers}
              onAdd={() => handleAddCode('modifiers')}
              onModify={(idx) => handleCodeModify('modifiers', idx, originalAICodes.modifiers?.[idx])}
              onAccept={(idx) => handleCodeAccept('modifiers', idx)}
              onReject={(idx) => handleCodeReject('modifiers', idx)}
              onReset={(idx) => handleCodeReset('modifiers', idx)}
              accentColor="slate"
              renderCode={(code) => code.modifier_code}
              renderDescription={(code) => code.modifier_name}
              isReadOnly={isReadOnly}
            />

            {/* Feedback */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">Coding Feedback</h3>
              </div>

              <div className="space-y-4">
                {feedback.documentation_gaps?.length > 0 && (
                  <FeedbackCard icon={AlertCircle} title="Documentation Gaps" items={feedback.documentation_gaps} color="amber" />
                )}
                {feedback.physician_queries_needed?.length > 0 && (
                  <FeedbackCard icon={MessageSquare} title="Physician Queries" items={feedback.physician_queries_needed} color="blue" />
                )}
                {feedback.coding_tips?.length > 0 && (
                  <FeedbackCard icon={Lightbulb} title="Coding Tips" items={feedback.coding_tips} color="emerald" />
                )}
                {feedback.compliance_alerts?.length > 0 && (
                  <FeedbackCard icon={ShieldAlert} title="Compliance Alerts" items={feedback.compliance_alerts} color="red" />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// Code Section Component
const CodeSection = ({ title, category, codes, originalCodes, onAdd, onModify, onAccept, onReject, onReset, accentColor, renderCode, renderDescription, isReadOnly = false }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500'
  };

  const badgeClasses = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-200 text-slate-700',
    red: 'bg-red-100 text-red-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    cyan: 'bg-cyan-100 text-cyan-700'
  };

  const codeArray = Array.isArray(codes) ? codes : [];
  const rejectedCount = codeArray.filter(c => c.status === 'rejected').length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-6 ${colorClasses[accentColor]} rounded-full`}></div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {codeArray.length > 0 && (
            <span className={`px-2 py-0.5 rounded text-xs ${badgeClasses[accentColor]}`}>{codeArray.length}</span>
          )}
          {rejectedCount > 0 && !isReadOnly && (
            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{rejectedCount} rejected</span>
          )}
        </div>
        {!isReadOnly && (
          <button onClick={onAdd} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus className="w-4 h-4" />Add
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {codeArray.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {codeArray.map((code, idx) => (
              <CodeRow
                key={idx}
                code={code}
                originalCode={originalCodes?.[idx]}
                renderCode={renderCode}
                renderDescription={renderDescription}
                onModify={() => onModify(idx)}
                onAccept={() => onAccept(idx)}
                onReject={() => onReject(idx)}
                onReset={() => onReset(idx)}
                accentColor={accentColor}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No {title.toLowerCase()} codes generated</p>
          </div>
        )}
      </div>
    </section>
  );
};

// Code Row Component - Updated with isReadOnly prop
const CodeRow = ({ code, originalCode, renderCode, renderDescription, onModify, onAccept, onReject, onReset, accentColor, isReadOnly = false }) => {
  const status = code.status || 'accepted';
  const isModified = code.isModified || status === 'modified';
  const isAdded = code.isUserAdded || status === 'added';
  const isRejected = status === 'rejected';
  const isAccepted = status === 'accepted';

  const statusColors = {
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    modified: 'bg-blue-100 text-blue-700',
    added: 'bg-violet-100 text-violet-700'
  };

  const codeColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-900',
    red: 'text-red-600',
    indigo: 'text-indigo-600',
    cyan: 'text-cyan-600'
  };

  return (
    <div className={`p-4 transition-all ${isRejected
      ? 'bg-red-50 border-l-4 border-red-500'
      : isModified
        ? 'bg-blue-50/30 border-l-4 border-blue-400'
        : isAdded
          ? 'bg-violet-50/30 border-l-4 border-violet-400'
          : 'border-l-4 border-transparent'
      }`}>
      {/* Show original if modified */}
      {isModified && code.originalCode && (
        <div className="mb-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Original AI Code</p>
          <p className="text-sm font-mono text-slate-600 line-through">
            {renderCode(code.originalCode)} — {renderDescription(code.originalCode)}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-lg font-bold ${isRejected ? 'text-red-400 line-through' : codeColorClasses[accentColor]}`}>
            {renderCode(code)}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[status]}`}>
            {isAdded ? 'Added' : isModified ? 'Modified' : isRejected ? 'Rejected' : 'Accepted'}
          </span>
          {code.confidence && !isRejected && (
            <span className={`px-2 py-0.5 rounded text-xs ${code.confidence === 'high' ? 'bg-emerald-50 text-emerald-600' :
              code.confidence === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
              }`}>
              {code.confidence}
            </span>
          )}
        </div>

        {/* Action buttons - hidden when read-only */}
        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={onAccept}
              className={`p-1.5 rounded-lg transition-all ${isAccepted && !isModified && !isAdded
                ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200'
                : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                }`}
              title="Accept"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onModify}
              className={`p-1.5 rounded-lg transition-all ${isModified
                ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200'
                : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'
                }`}
              title="Modify"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              className={`p-1.5 rounded-lg transition-all ${isRejected
                ? 'bg-red-100 text-red-600 ring-2 ring-red-200'
                : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                }`}
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-all"
              title="Reset to Accepted"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className={`text-sm mb-2 ${isRejected ? 'text-red-400 line-through' : 'text-slate-700'}`}>
        {renderDescription(code)}
      </p>

      {/* Show change reason for modified/added codes */}
      {(isModified || isAdded) && code.changeReason && (
        <div className="bg-amber-50 rounded-lg p-2.5 mb-2 border border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Reason for {isAdded ? 'Addition' : 'Change'}:</span> {code.changeReason}
          </p>
          {code.changeComment && (
            <p className="text-xs text-amber-700 mt-1">
              <span className="font-semibold">Comment:</span> {code.changeComment}
            </p>
          )}
        </div>
      )}

      {code.ai_reasoning && !isRejected && (
        <div className="bg-violet-50 rounded-lg p-2.5 mb-2 border border-violet-100">
          <p className="text-xs text-violet-700">
            <span className="font-semibold">AI Reasoning:</span> {code.ai_reasoning}
          </p>
        </div>
      )}

      {code.level_justification && !isRejected && (
        <div className="bg-slate-50 rounded-lg p-2.5 mb-2 border border-slate-200">
          <p className="text-xs font-semibold text-slate-900 mb-1">MDM Justification:</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
            {code.level_justification.mdm_complexity && <div><span className="text-slate-500">Complexity:</span> {code.level_justification.mdm_complexity}</div>}
            {code.level_justification.number_of_diagnoses && <div><span className="text-slate-500">Diagnoses:</span> {code.level_justification.number_of_diagnoses}</div>}
            {code.level_justification.data_reviewed && <div><span className="text-slate-500">Data:</span> {code.level_justification.data_reviewed}</div>}
            {code.level_justification.risk_of_complications && <div><span className="text-slate-500">Risk:</span> {code.level_justification.risk_of_complications}</div>}
          </div>
        </div>
      )}

      {code.evidence?.[0]?.exact_text && !isRejected && (
        <p className="text-xs text-blue-600 italic">"{code.evidence[0].exact_text}"</p>
      )}
    </div>
  );
};

// Medications Section Component with expand/collapse
const MedicationsSection = ({ medications }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_SHOW = 5;
  const hasMore = medications.length > INITIAL_SHOW;
  const displayedMeds = isExpanded ? medications : medications.slice(0, INITIAL_SHOW);

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Pill className="w-4 h-4 text-purple-600" />
        <h3 className="font-semibold text-slate-900 text-sm">Medications</h3>
        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{medications.length}</span>
      </div>
      <div className="space-y-2">
        {displayedMeds.map((med, idx) => {
          const medName = typeof med === 'string' ? med : (med.name || med.medication || 'Unknown');
          const medDetails = typeof med === 'object' ? [med.dose, med.route, med.frequency].filter(Boolean).join(' ') : '';

          return (
            <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 text-sm">{medName}</p>
                {medDetails && <p className="text-xs text-slate-500">{medDetails}</p>}
              </div>
            </div>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4 rotate-180" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                + {medications.length - INITIAL_SHOW} more medications
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Feedback Card Component
const FeedbackCard = ({ icon: Icon, title, items, color }) => {
  const colorClasses = {
    amber: { icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', border: 'border-slate-200' },
    blue: { icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-slate-200' },
    emerald: { icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-slate-200' },
    red: { icon: 'text-red-600', badge: 'bg-red-100 text-red-700', border: 'border-slate-200' }
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${colors.border}`}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colors.icon}`} />
        <span className="font-medium text-slate-900 text-sm">{title}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${colors.badge}`}>{items.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div key={idx} className="p-4">
            <p className="font-medium text-slate-900 text-sm">{item.gap || item.query || item.tip || item.alert || item}</p>
            {item.impact && <p className="text-xs text-amber-600 mt-1">Impact: {item.impact}</p>}
            {item.suggestion && <p className="text-xs text-slate-600 mt-1">Suggestion: {item.suggestion}</p>}
            {item.reason && <p className="text-xs text-slate-600 mt-1">Reason: {item.reason}</p>}
            {item.related_code && <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">Related: {item.related_code}</span>}
            {item.priority && (
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>{item.priority} priority</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartDetail;
