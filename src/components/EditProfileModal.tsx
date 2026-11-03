/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentProfile, GradeLevel } from '../types/index.ts';
import { updateUserProfile } from '../services/api.ts';
import { UserCheck, GraduationCap, School, MapPin, X, Check, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StudentProfile;
  onProfileUpdated: (updatedUser: StudentProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [grade, setGrade] = useState<GradeLevel>(currentUser.grade || 10);
  const [school, setSchool] = useState(currentUser.school || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setGrade(currentUser.grade || 10);
      setSchool(currentUser.school || '');
      setCity(currentUser.city || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Оқушының аты-жөнін бос қалдыруға болмайды');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await updateUserProfile({
        id: currentUser.id,
        name: name.trim(),
        grade,
        school: school.trim(),
        city: city.trim(),
      });

      setSuccessMsg('Деректер сәтті жаңартылды!');
      onProfileUpdated(res.user);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Профильді сақтау кезінде қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions: GradeLevel[] = [5, 6, 7, 8, 9, 10];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Жеке профильді өңдеу</h2>
              <p className="text-xs text-amber-100">
                Аты-жөні, сыныбы, мектебі мен қаласын өзгерту
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Жабу"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email Info (read-only Google identifier) */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Байланыстырылған Google пошта:</span>
            <span className="text-sm font-semibold text-slate-200">{currentUser.email}</span>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Оқушының толық аты-жөні:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Мысалы: Мұратұлы Айсұлтан"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Grade selection (5 to 10) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Оқитын сыныбыңыз (5–10 сынып):</span>
              </span>
              <span className="text-amber-400 font-bold">{grade}-сынып</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {gradeOptions.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    grade === g
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {g}-сынып
                </button>
              ))}
            </div>
          </div>

          {/* School */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <School className="w-4 h-4 text-slate-400" />
              <span>Мектебіңіз (Лицей, гимназия, мектеп атауы):</span>
            </label>
            <input
              type="text"
              value={school}
              onChange={e => setSchool(e.target.value)}
              placeholder="Мысалы: №178 мамандандырылған лицей"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* City / Region */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Қаласы / Ауданы / Өңірі:</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Мысалы: Алматы қ., Медеу ауданы"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Бас тарту
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Сақталуда...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Өзгерістерді сақтау</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
