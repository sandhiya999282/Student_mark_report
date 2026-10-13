import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Student, SystemConfig } from "../types";

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null; // null if adding new student
  allSubjects: string[];
  config: SystemConfig;
  onClose: () => void;
  onSave: (updatedStudent: Partial<Student> & { id?: string }) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  allSubjects,
  config,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [subjectMarks, setSubjectMarks] = useState<Record<string, number>>({});
  const [newSubjectName, setNewSubjectName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setRollNo(student.rollNo);
      setSubjectMarks({ ...student.subjectMarks });
    } else {
      // New student defaults
      setName("");
      setRollNo("");
      const initialMarks: Record<string, number> = {};
      allSubjects.forEach((sub) => {
        initialMarks[sub] = 50;
      });
      setSubjectMarks(initialMarks);
    }
    setValidationError(null);
  }, [student, allSubjects, isOpen]);

  if (!isOpen) return null;

  const handleMarkChange = (subject: string, val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    setSubjectMarks((prev) => ({
      ...prev,
      [subject]: Math.max(0, Math.min(config.maxMarksPerSubject, num)),
    }));
  };

  const handleAddSubject = () => {
    const clean = newSubjectName.trim();
    if (!clean) return;
    if (subjectMarks[clean] !== undefined) {
      setValidationError(`Subject "${clean}" already exists.`);
      return;
    }
    setSubjectMarks((prev) => ({ ...prev, [clean]: 50 }));
    setNewSubjectName("");
    setValidationError(null);
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjectMarks((prev) => {
      const copy = { ...prev };
      delete copy[sub];
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Please enter a valid Student Name.");
      return;
    }
    if (!rollNo.trim()) {
      setValidationError("Please enter a valid Roll Number.");
      return;
    }
    if (Object.keys(subjectMarks).length === 0) {
      setValidationError("Student must have at least one subject mark recorded.");
      return;
    }

    onSave({
      id: student ? student.id : undefined,
      name: name.trim(),
      rollNo: rollNo.trim(),
      subjectMarks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="font-extrabold text-slate-900 text-base">
            {student ? `Edit Student: ${student.name}` : "Add New Student Record"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number / ID *
              </label>
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. 101, STU-2025-01"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>

          {/* Subject Marks Input Group */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Subject Marks (Max: {config.maxMarksPerSubject})
              </label>
              <span className="text-[11px] text-slate-400">Passing: {config.passingMarkPerSubject}</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(subjectMarks).map(([sub, mark]) => (
                <div
                  key={sub}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{sub}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={config.maxMarksPerSubject}
                      value={mark}
                      onChange={(e) => handleMarkChange(sub, e.target.value)}
                      className="w-20 px-2.5 py-1 text-xs sm:text-sm text-right bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Subject */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Add another subject (e.g. Art, French)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save & Recalculate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
