'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientData } from './patient-form';

interface VerifyPatientProps {
  patientData: PatientData;
  onConfirm: () => void;
  onEdit: () => void;
}

export default function VerifyPatient({ patientData, onConfirm, onEdit }: VerifyPatientProps) {
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold text-right max-w-[60%]">
        {value || '—'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verify Patient Details
          </CardTitle>
          <p className="text-gray-500 mt-2">
            Please review the information before proceeding
          </p>
        </CardHeader>
        
        <CardContent className="p-6 pt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <span className="text-sm font-medium text-green-600">Patient Details</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-green-600">Verify</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm text-gray-400">Connect</span>
            </div>
          </div>

          {/* Patient Summary Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{patientData.name}</h3>
                <p className="text-sm text-gray-600">
                  ID: {patientData.patientId} • {patientData.age} years • {patientData.gender}
                </p>
              </div>
            </div>
          </div>

          {/* Details Sections */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                  📋
                </span>
                Basic Information
              </h4>
              <InfoRow label="Full Name" value={patientData.name} />
              <InfoRow label="Patient ID" value={patientData.patientId} />
              <InfoRow label="Age" value={`${patientData.age} years`} />
              <InfoRow label="Gender" value={patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1)} />
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                  📞
                </span>
                Contact Information
              </h4>
              <InfoRow label="Phone Number" value={patientData.phone} />
            </div>

            {/* Medical History */}
            {patientData.medicalHistory && (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">
                    🏥
                  </span>
                  Medical History
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {patientData.medicalHistory}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              ← Edit Details
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all duration-200"
            >
              Confirm & Connect →
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By confirming, you agree that the patient information is accurate and consent has been obtained for the EEG monitoring session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
