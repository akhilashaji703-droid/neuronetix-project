'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getSessionSummary, SessionSummary } from '@/lib/api';
import { PatientData } from '@/components/onboarding';

interface SessionSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  patientData: PatientData;
  sessionId: string;
  duration: number;
}

export default function SessionSummaryDialog({
  open,
  onClose,
  patientData,
  sessionId,
  duration,
}: SessionSummaryDialogProps) {
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && sessionId) {
      fetchSummary();
    }
  }, [open, sessionId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSessionSummary(patientData.patientId, sessionId);
      setSummary(result);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError('Failed to generate session summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handlePrint = () => {
    if (!printRef.current || !summary) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EEG Session Report - ${patientData.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #10b981;
            }
            .header h1 { 
              font-size: 28px; 
              color: #059669;
              margin-bottom: 8px;
            }
            .header p { 
              color: #6b7280; 
              font-size: 14px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 16px; 
              margin-bottom: 24px;
            }
            .stat-card { 
              background: #f9fafb; 
              border: 1px solid #e5e7eb;
              border-radius: 8px; 
              padding: 16px; 
              text-align: center;
            }
            .stat-label { 
              font-size: 12px; 
              color: #6b7280; 
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .stat-value { 
              font-size: 24px; 
              font-weight: bold; 
              color: #059669;
            }
            .section { 
              margin-bottom: 24px;
              page-break-inside: avoid;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: 600; 
              color: #374151;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            .mental-state-bar {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
            }
            .mental-state-label {
              width: 80px;
              font-size: 14px;
            }
            .mental-state-track {
              flex: 1;
              height: 20px;
              background: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
              margin: 0 12px;
            }
            .mental-state-fill {
              height: 100%;
              border-radius: 4px;
            }
            .mental-state-value {
              width: 50px;
              text-align: right;
              font-size: 14px;
              font-weight: 500;
            }
            .brainwave-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 12px;
            }
            .brainwave-item {
              text-align: center;
            }
            .brainwave-bar-container {
              height: 80px;
              background: #f3f4f6;
              border-radius: 6px;
              position: relative;
              overflow: hidden;
              margin-bottom: 8px;
            }
            .brainwave-bar {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
            }
            .brainwave-name {
              font-size: 12px;
              color: #6b7280;
            }
            .brainwave-value {
              font-size: 14px;
              font-weight: 600;
            }
            .analysis-content {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
            }
            .analysis-content strong {
              color: #059669;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #9ca3af;
            }
            @media print {
              body { padding: 20px; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🧠 NeuroNetix EEG Session Report</h1>
            <p>Patient: ${patientData.name} | ID: ${patientData.patientId} | Age: ${patientData.age}y | ${patientData.gender}</p>
            <p>Session: ${sessionId} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Duration</div>
              <div class="stat-value">${formatDuration(duration)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Stress</div>
              <div class="stat-value">${summary.stats.avg_stress.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Signal Quality</div>
              <div class="stat-value">${summary.stats.avg_signal_quality.toFixed(0)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Samples</div>
              <div class="stat-value">${summary.stats.total_samples.toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Mental State Distribution</div>
            <div class="mental-state-bar">
              <span class="mental-state-label">Relaxed</span>
              <div class="mental-state-track">
                <div class="mental-state-fill" style="width: ${summary.stats.relaxed_percent}%; background: #10b981;"></div>
              </div>
              <span class="mental-state-value">${summary.stats.relaxed_percent.toFixed(1)}%</span>
            </div>
            <div class="mental-state-bar">
              <span class="mental-state-label">Neutral</span>
              <div class="mental-state-track">
                <div class="mental-state-fill" style="width: ${summary.stats.neutral_percent}%; background: #6b7280;"></div>
              </div>
              <span class="mental-state-value">${summary.stats.neutral_percent.toFixed(1)}%</span>
            </div>
            <div class="mental-state-bar">
              <span class="mental-state-label">Focused</span>
              <div class="mental-state-track">
                <div class="mental-state-fill" style="width: ${summary.stats.focused_percent}%; background: #f59e0b;"></div>
              </div>
              <span class="mental-state-value">${summary.stats.focused_percent.toFixed(1)}%</span>
            </div>
            <div class="mental-state-bar">
              <span class="mental-state-label">Stressed</span>
              <div class="mental-state-track">
                <div class="mental-state-fill" style="width: ${summary.stats.stressed_percent}%; background: #ef4444;"></div>
              </div>
              <span class="mental-state-value">${summary.stats.stressed_percent.toFixed(1)}%</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Brainwave Power Distribution</div>
            <div class="brainwave-grid">
              <div class="brainwave-item">
                <div class="brainwave-bar-container">
                  <div class="brainwave-bar" style="height: ${summary.stats.avg_delta}%; background: #6366f1;"></div>
                </div>
                <div class="brainwave-name">Delta</div>
                <div class="brainwave-value">${summary.stats.avg_delta.toFixed(1)}%</div>
              </div>
              <div class="brainwave-item">
                <div class="brainwave-bar-container">
                  <div class="brainwave-bar" style="height: ${summary.stats.avg_theta}%; background: #3b82f6;"></div>
                </div>
                <div class="brainwave-name">Theta</div>
                <div class="brainwave-value">${summary.stats.avg_theta.toFixed(1)}%</div>
              </div>
              <div class="brainwave-item">
                <div class="brainwave-bar-container">
                  <div class="brainwave-bar" style="height: ${summary.stats.avg_alpha}%; background: #10b981;"></div>
                </div>
                <div class="brainwave-name">Alpha</div>
                <div class="brainwave-value">${summary.stats.avg_alpha.toFixed(1)}%</div>
              </div>
              <div class="brainwave-item">
                <div class="brainwave-bar-container">
                  <div class="brainwave-bar" style="height: ${summary.stats.avg_beta}%; background: #f59e0b;"></div>
                </div>
                <div class="brainwave-name">Beta</div>
                <div class="brainwave-value">${summary.stats.avg_beta.toFixed(1)}%</div>
              </div>
              <div class="brainwave-item">
                <div class="brainwave-bar-container">
                  <div class="brainwave-bar" style="height: ${summary.stats.avg_gamma}%; background: #ef4444;"></div>
                </div>
                <div class="brainwave-name">Gamma</div>
                <div class="brainwave-value">${summary.stats.avg_gamma.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">AI Analysis ${summary.ai_generated ? '(Powered by Gemini)' : '(Auto-generated)'}</div>
            <div class="analysis-content">
              ${summary.analysis.replace(/\*\*/g, '').replace(/\*/g, '•').replace(/\n/g, '<br/>')}
            </div>
          </div>

          <div class="footer">
            <p>Generated by NeuroNetix EEG Brain Signal Dashboard</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-[900px] w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span>🧠</span>
            EEG Session Summary
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis for {patientData.name} • Session: {sessionId}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Analyzing EEG data with AI...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={fetchSummary} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && summary && (
          <div ref={printRef} className="space-y-6">
            {/* Session Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-blue-600 font-medium">Duration</p>
                  <p className="text-xl font-bold text-blue-800">{formatDuration(duration)}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-green-600 font-medium">Avg Stress</p>
                  <p className="text-xl font-bold text-green-800">{summary.stats.avg_stress.toFixed(1)}%</p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-purple-600 font-medium">Signal Quality</p>
                  <p className="text-xl font-bold text-purple-800">{summary.stats.avg_signal_quality.toFixed(0)}%</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-orange-600 font-medium">Samples</p>
                  <p className="text-xl font-bold text-orange-800">{summary.stats.total_samples.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Mental State Distribution */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Mental State Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-20">Relaxed</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${summary.stats.relaxed_percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{summary.stats.relaxed_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-20">Neutral</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-500 rounded-full transition-all"
                        style={{ width: `${summary.stats.neutral_percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{summary.stats.neutral_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-20">Focused</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${summary.stats.focused_percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{summary.stats.focused_percent.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-20">Stressed</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${summary.stats.stressed_percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{summary.stats.stressed_percent.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">
                    {summary.ai_generated ? '🤖 AI Analysis' : '📊 Session Analysis'}
                  </h4>
                  {summary.ai_generated && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Powered by Gemini
                    </span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: summary.analysis
                        .replace(/## /g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
                        .replace(/### /g, '<h4 class="text-md font-semibold mt-3 mb-1">')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Brainwave Distribution */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Brainwave Power Distribution</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { name: 'Delta', value: summary.stats.avg_delta, color: 'bg-indigo-500' },
                    { name: 'Theta', value: summary.stats.avg_theta, color: 'bg-blue-500' },
                    { name: 'Alpha', value: summary.stats.avg_alpha, color: 'bg-green-500' },
                    { name: 'Beta', value: summary.stats.avg_beta, color: 'bg-yellow-500' },
                    { name: 'Gamma', value: summary.stats.avg_gamma, color: 'bg-red-500' },
                  ].map((band) => (
                    <div key={band.name} className="text-center">
                      <div className="h-24 bg-gray-100 rounded-lg relative overflow-hidden mb-2">
                        <div 
                          className={`absolute bottom-0 left-0 right-0 ${band.color} transition-all`}
                          style={{ height: `${band.value}%` }}
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-600">{band.name}</p>
                      <p className="text-sm font-bold text-gray-800">{band.value.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
            Print Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
