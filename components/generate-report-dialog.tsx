'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type ReportPayload = {
  summary: string;
  relevant_entities: string[];
  insights: string[];
  lesson_or_curriculum: string;
  action_step: string;
};

export function GenerateReportDialog({ chatId, disabled }: { chatId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [guidance, setGuidance] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState<'input' | 'preview'>('input');
  const [report, setReport] = useState<ReportPayload | null>(null);

  const reset = () => {
    setGuidance('');
    setLoading(false);
    setSaving(false);
    setStage('input');
    setReport(null);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) reset();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, guidance }),
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const json = (await res.json()) as { report: ReportPayload };
      setReport(json.report);
      setStage('preview');
    } catch (e) {
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const res = await fetch('/api/report', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, report, guidance }),
      });
      if (!res.ok) throw new Error('Failed to save report');
      toast.success('Report saved');
      setOpen(false);
      reset();
    } catch (e) {
      toast.error('Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled} variant="secondary">Generate report</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Generate report</AlertDialogTitle>
          <AlertDialogDescription>
            Nisa will generate a report based on the current chat. Add any additional guidance here.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {stage === 'input' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="guidance">Additional guidance</Label>
            <Textarea
              id="guidance"
              placeholder="Add any additional guidance..."
              value={guidance}
              onChange={(e) => setGuidance(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {stage === 'preview' && report && (
          <div className="flex flex-col gap-3 max-h-[60dvh] overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="summary">Summary of convo</Label>
              <Textarea id="summary" value={report.summary} onChange={(e) => setReport({ ...report, summary: e.target.value })} rows={4} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="entities">Relevant entities (one per line)</Label>
              <Textarea
                id="entities"
                value={(report.relevant_entities || []).join('\n')}
                onChange={(e) => setReport({ ...report, relevant_entities: e.target.value.split('\n').map((s) => s).filter((s) => s.trim().length > 0) })}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="insights">Insights generated (one per line)</Label>
              <Textarea
                id="insights"
                value={(report.insights || []).join('\n')}
                onChange={(e) => setReport({ ...report, insights: e.target.value.split('\n').map((s) => s).filter((s) => s.trim().length > 0) })}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson">Lesson/curriculum discussed</Label>
              <Input id="lesson" value={report.lesson_or_curriculum} onChange={(e) => setReport({ ...report, lesson_or_curriculum: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="action">Action step discussed/decided upon</Label>
              <Textarea id="action" value={report.action_step} onChange={(e) => setReport({ ...report, action_step: e.target.value })} rows={3} />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading || saving}>Cancel</Button>
          {stage === 'input' ? (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


