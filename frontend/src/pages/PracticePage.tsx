import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Send, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { getSubmissionValidationMessage, validateDraftDesign } from '../lib/designValidation';
import { acquireSubmissionLock } from '../lib/submissionLock';

const emptyClass = () => ({
  id: `class_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  responsibilities: [''],
  attributes: [{ name: '', type: '' }],
  methods: [{ name: '', returnType: '', params: [{ name: '', type: '' }] }],
});

const emptyRelationship = () => ({
  id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  source: '',
  target: '',
  type: 'associates',
});

export default function PracticePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [design, setDesign] = useState({ classes: [] as any[], interfaces: [], relationships: [] as any[], notes: [''] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const submitInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setAttempt(null);
      try {
        if (!id) throw new Error('Attempt ID is missing.');
        const { data } = await api.get(`/attempts/${id}`);
        const loadedAttempt = data.attempt;
        if (!loadedAttempt) throw new Error('Attempt record was not returned.');
        const existing = loadedAttempt.designSubmission ?? loadedAttempt.design ?? {};
        const classes = Array.isArray(existing.classes) ? existing.classes : [];
        if (active) {
          setAttempt(loadedAttempt);
          setDesign({
            classes: classes.length
              ? classes.map((cls: any) => ({
                  ...cls,
                  responsibilities: Array.isArray(cls.responsibilities) ? cls.responsibilities : [],
                  attributes: Array.isArray(cls.attributes) ? cls.attributes : [],
                  methods: Array.isArray(cls.methods)
                    ? cls.methods.map((method: any) => ({
                        ...method,
                        params: Array.isArray(method.params) ? method.params : [],
                      }))
                    : [],
                }))
              : [emptyClass()],
            interfaces: Array.isArray(existing.interfaces) ? existing.interfaces : [],
            relationships: Array.isArray(existing.relationships) && existing.relationships.length
              ? existing.relationships
              : [emptyRelationship()],
            notes: Array.isArray(existing.notes) && existing.notes.length ? existing.notes : [''],
          });
        }
      } catch (requestError: any) {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load this attempt.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const readOnly = Boolean(attempt && attempt.status !== 'draft');
  const classNames = useMemo(() => design.classes.map((cls) => cls.name).filter(Boolean), [design.classes]);

  const updateClass = (index: number, patch: Partial<any>) => {
    setDesign((current) => ({
      ...current,
      classes: current.classes.map((cls, i) => i === index ? { ...cls, ...patch } : cls),
    }));
  };

  const addClass = () => setDesign((current) => ({ ...current, classes: [...current.classes, emptyClass()] }));
  const removeClass = (index: number) => setDesign((current) => ({ ...current, classes: current.classes.filter((_, idx) => idx !== index) }));

  const addAttribute = (classIndex: number) => {
    setDesign((current) => ({
      ...current,
      classes: current.classes.map((item, idx) => idx === classIndex ? { ...item, attributes: [...item.attributes, { name: '', type: '' }] } : item),
    }));
  };

  const addMethod = (classIndex: number) => {
    setDesign((current) => ({
      ...current,
      classes: current.classes.map((item, idx) => idx === classIndex ? { ...item, methods: [...item.methods, { name: '', returnType: '', params: [{ name: '', type: '' }] }] } : item),
    }));
  };

  const addRelationship = () => setDesign((current) => ({ ...current, relationships: [...current.relationships, emptyRelationship()] }));
  const saveDraft = async () => {
    if (!id || !attempt || attempt.status !== 'draft') return;
    setMessage('');
    setError('');
    const validationError = validateDraftDesign(design);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const { data } = await api.patch(`/attempts/${id}/draft`, { design });
      setAttempt(data.attempt);
      setMessage('Draft saved.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to save draft.');
    }
  };

  const submitAttempt = async () => {
    if (!id || !attempt || attempt.status !== 'draft') return;
    setError('');
    setMessage('');
    const validationError = validateDraftDesign(design);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!acquireSubmissionLock(submitInFlight)) return;
    setSubmitting(true);
    try {
      const payload = { design };
      const { data } = await api.post(`/attempts/${id}/submit`, payload);
      const submissionId = data.attempt?.id || data.attempt?._id;
      if (!submissionId || String(data.evaluation?.attemptId) !== String(submissionId)) {
        throw new Error('The submission was saved, but its evaluation result could not be confirmed. Check your attempt history.');
      }
      navigate(`/attempts/${submissionId}/report`, { replace: true });
    } catch (err: any) {
      setError(
        getSubmissionValidationMessage(err)
        || err.response?.data?.message
        || err.message
        || 'Submission could not be validated.',
      );
    } finally {
      submitInFlight.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-slate-300">Loading saved attempt…</div>;
  }

  if (error && !attempt) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">{error}</div>
        <button onClick={() => navigate('/history')} className="mt-5 text-violet-300">Back to attempt history</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Practice workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Design your solution</h1>
        </div>
        {readOnly ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">
              This attempt is read-only.
            </span>
            {attempt.status === 'evaluated' && <button onClick={() => navigate(`/attempts/${id}/report`)} className="text-violet-300">Open evaluation report</button>}
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={saveDraft} disabled={!attempt || attempt.status !== 'draft'} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 hover:border-violet-500/50 disabled:opacity-60"><Save className="mr-2 inline h-4 w-4" />Save draft</button>
            <button onClick={submitAttempt} disabled={submitting} className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-60"><Send className="mr-2 inline h-4 w-4" />{submitting ? 'Submitting...' : 'Submit attempt'}</button>
          </div>
        )}
      </div>

      {message && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{message}</div>}
      {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

      <fieldset disabled={readOnly} className="contents">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {design.classes.map((cls, classIndex) => (
            <div key={cls.id} className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
              <div className="mb-4 flex items-center justify-between">
                <input value={cls.name} onChange={(e) => updateClass(classIndex, { name: e.target.value })} placeholder="Class name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-lg font-medium text-white outline-none" />
                <button onClick={() => removeClass(classIndex)} className="ml-3 text-slate-400"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Responsibilities</span>
                  <textarea value={cls.responsibilities.join('\n')} onChange={(e) => updateClass(classIndex, { responsibilities: e.target.value.split('\n').filter(Boolean) })} rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none" placeholder="Single responsibility per line" />
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Attributes</span>
                    <button onClick={() => addAttribute(classIndex)} className="inline-flex items-center gap-1 text-violet-300"><Plus className="h-3 w-3" /> Add</button>
                  </div>
                  <div className="space-y-2">
                    {cls.attributes.map((attribute: any, attributeIndex: number) => (
                      <div key={`${cls.id}-attr-${attributeIndex}`} className="grid gap-2 md:grid-cols-[1fr_0.7fr]">
                        <input value={attribute.name} onChange={(e) => { const next = [...cls.attributes]; next[attributeIndex] = { ...next[attributeIndex], name: e.target.value }; updateClass(classIndex, { attributes: next }); }} placeholder="attribute" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                        <input value={attribute.type} onChange={(e) => { const next = [...cls.attributes]; next[attributeIndex] = { ...next[attributeIndex], type: e.target.value }; updateClass(classIndex, { attributes: next }); }} placeholder="type" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Methods</span>
                    <button onClick={() => addMethod(classIndex)} className="inline-flex items-center gap-1 text-violet-300"><Plus className="h-3 w-3" /> Add</button>
                  </div>
                  <div className="space-y-3">
                    {cls.methods.map((method: any, methodIndex: number) => (
                      <div key={`${cls.id}-method-${methodIndex}`} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className="grid gap-2 md:grid-cols-[1fr_0.7fr]">
                          <input value={method.name} onChange={(e) => { const next = [...cls.methods]; next[methodIndex] = { ...next[methodIndex], name: e.target.value }; updateClass(classIndex, { methods: next }); }} placeholder="methodName" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                          <input value={method.returnType} onChange={(e) => { const next = [...cls.methods]; next[methodIndex] = { ...next[methodIndex], returnType: e.target.value }; updateClass(classIndex, { methods: next }); }} placeholder="return type" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {method.params.map((param: any, paramIndex: number) => (
                            <div key={`${cls.id}-param-${methodIndex}-${paramIndex}`} className="grid gap-2 md:grid-cols-[1fr_0.7fr]">
                              <input value={param.name} onChange={(e) => { const next = [...cls.methods]; next[methodIndex].params[paramIndex] = { ...next[methodIndex].params[paramIndex], name: e.target.value }; updateClass(classIndex, { methods: next }); }} placeholder="param" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                              <input value={param.type} onChange={(e) => { const next = [...cls.methods]; next[methodIndex].params[paramIndex] = { ...next[methodIndex].params[paramIndex], type: e.target.value }; updateClass(classIndex, { methods: next }); }} placeholder="type" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" />
                            </div>
                          ))}
                          <button onClick={() => { const next = [...cls.methods]; next[methodIndex].params.push({ name: '', type: '' }); updateClass(classIndex, { methods: next }); }} className="text-xs text-violet-300">+ Add parameter</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button onClick={addClass} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-4 text-violet-200">
            <Plus className="h-4 w-4" /> Add class
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
            <div className="mb-4 text-sm uppercase tracking-[0.2em] text-slate-400">Live preview</div>
            <svg viewBox="0 0 340 260" className="h-64 w-full rounded-xl bg-slate-950 p-2">
              {design.classes.map((cls, idx) => {
                const x = 40 + (idx % 2) * 150;
                const y = 40 + Math.floor(idx / 2) * 90;
                return (
                  <g key={cls.id}>
                    <rect x={x} y={y} width={120} height={64} rx={12} fill="#111827" stroke="#8b5cf6" />
                    <text x={x + 12} y={y + 24} fill="white" fontSize="12" fontWeight="600">{cls.name || 'Class'}</text>
                    <text x={x + 12} y={y + 40} fill="#cbd5e1" fontSize="10">{cls.attributes.length} fields</text>
                  </g>
                );
              })}
              {design.relationships.map((relation) => {
                const sourceIndex = design.classes.findIndex((cls) => cls.name === relation.source);
                const targetIndex = design.classes.findIndex((cls) => cls.name === relation.target);
                if (sourceIndex === -1 || targetIndex === -1) return null;
                const src = { x: 40 + (sourceIndex % 2) * 150 + 60, y: 40 + Math.floor(sourceIndex / 2) * 90 + 32 };
                const tgt = { x: 40 + (targetIndex % 2) * 150 + 60, y: 40 + Math.floor(targetIndex / 2) * 90 + 32 };
                return <line key={relation.id} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#a78bfa" strokeWidth="2" />;
              })}
            </svg>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
            <div className="mb-4 flex items-center justify-between text-sm uppercase tracking-[0.2em] text-slate-400">
              <span>Relationships</span>
              <button onClick={addRelationship} className="inline-flex items-center gap-1 text-violet-300"><Plus className="h-3 w-3" /> Add</button>
            </div>
            <div className="space-y-3">
              {design.relationships.map((relation, index) => (
                <div key={relation.id} className="grid gap-2 md:grid-cols-[1fr_1fr_0.6fr]">
                  <select value={relation.source} onChange={(e) => { const next = [...design.relationships]; next[index] = { ...next[index], source: e.target.value }; setDesign((current) => ({ ...current, relationships: next })); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none">
                    <option value="">Source</option>
                    {classNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select value={relation.target} onChange={(e) => { const next = [...design.relationships]; next[index] = { ...next[index], target: e.target.value }; setDesign((current) => ({ ...current, relationships: next })); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none">
                    <option value="">Target</option>
                    {classNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select value={relation.type} onChange={(e) => { const next = [...design.relationships]; next[index] = { ...next[index], type: e.target.value as any }; setDesign((current) => ({ ...current, relationships: next })); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none">
                    <option value="associates">Associates</option>
                    <option value="extends">Extends</option>
                    <option value="implements">Implements</option>
                    <option value="composes">Composes</option>
                    <option value="aggregates">Aggregates</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#091827] p-5">
            <div className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">Design notes</div>
            <textarea value={design.notes.join('\n')} onChange={(e) => setDesign((current) => ({ ...current, notes: e.target.value.split('\n').filter(Boolean) }))} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none" placeholder="Document trade-offs, assumptions, and key design reasoning." />
          </div>
        </div>
      </div>
      </fieldset>
    </div>
  );
}
