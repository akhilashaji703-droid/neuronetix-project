'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface PatientData {
  name: string;
  patientId: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  medicalHistory: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  initialData?: PatientData;
}

export default function PatientForm({ onSubmit, initialData }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>(
    initialData || {
      name: '',
      patientId: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      emergencyContact: '',
      medicalHistory: '',
    }
  );

  const [errors, setErrors] = useState<Partial<PatientData>>({});

  const validateForm = () => {
    const newErrors: Partial<PatientData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age.trim()) newErrors.age = 'Age is required';
    if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Auto-generate patient ID if not provided
      const dataToSubmit = {
        ...formData,
        patientId: formData.patientId || `PAT-${Date.now().toString().slice(-6)}`,
      };
      onSubmit(dataToSubmit);
    }
  };

  const handleChange = (field: keyof PatientData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">🧠</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            NeuroNetix EEG Test
          </CardTitle>
          <p className="text-gray-500 mt-2">
            Please enter patient details to begin the EEG monitoring session
          </p>
        </CardHeader>
        
        <CardContent className="p-6 pt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-green-600">Patient Details</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="text-sm text-gray-400">Verify</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="text-sm text-gray-400">Connect</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter patient's full name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`h-11 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`h-11 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className={`h-11 ${errors.age ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}`}
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className={`w-full h-11 px-3 rounded-md border bg-white text-sm ${errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} focus:outline-none focus:ring-2`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>
            </div>


            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg transition-all duration-200"
            >
              Continue to Verification →
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
