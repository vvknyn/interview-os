"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfidenceIndicator, ConfidenceBadge, WarningBanner } from "./ConfidenceIndicator";
import { ResumeData, ResumeExperience, ResumeCompetencyCategory, ResumeEducation } from "@/types/resume";
import { ParsedResumeResult, parseResumeWithAI, extractPDFText, extractDocxText } from "@/actions/resume";
import { FileText, Upload, ClipboardText, ArrowRight, ArrowLeft, Check, X, Sparkle, Warning, PencilSimple } from "@phosphor-icons/react";

interface ResumeImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: ResumeData, source: 'pdf' | 'docx' | 'text', confidence: number) => void;
}

type ImportStep = 'input' | 'parsing' | 'review';
type InputMethod = 'file' | 'paste';

export function ResumeImportModal({ isOpen, onClose, onImport }: ResumeImportModalProps) {
    const [step, setStep] = useState<ImportStep>('input');
    const [inputMethod, setInputMethod] = useState<InputMethod>('file');
    const [pastedText, setPastedText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parseResult, setParseResult] = useState<ParsedResumeResult | null>(null);
    const [editedData, setEditedData] = useState<ResumeData | null>(null);
    const [contentType, setContentType] = useState<'pdf' | 'docx' | 'text'>('text');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('input');
        setPastedText("");
        setSelectedFile(null);
        setError(null);
        setParseResult(null);
        setEditedData(null);
        setIsProcessing(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'pdf') {
                setContentType('pdf');
            } else if (extension === 'docx' || extension === 'doc') {
                setContentType('docx');
            } else if (extension === 'txt') {
                setContentType('text');
            } else {
                setError("Unsupported file type. Please use PDF, DOCX, or TXT.");
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'pdf') {
                setContentType('pdf');
            } else if (extension === 'docx' || extension === 'doc') {
                setContentType('docx');
            } else if (extension === 'txt') {
                setContentType('text');
            } else {
                setError("Unsupported file type. Please use PDF, DOCX, or TXT.");
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // Convert ArrayBuffer to base64 (browser-compatible)
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const processFile = async (file: File): Promise<string> => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'txt') {
            return await file.text();
        }

        // Convert file to base64 for server-side processing (browser-compatible)
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        console.log(`[ResumeImport] Processing ${extension} file, base64 length: ${base64.length}`);

        if (extension === 'pdf') {
            const result = await extractPDFText(base64);
            if (result.error) throw new Error(result.error);
            return result.text || "";
        }

        if (extension === 'docx' || extension === 'doc') {
            const result = await extractDocxText(base64);
            if (result.error) throw new Error(result.error);
            return result.text || "";
        }

        throw new Error("Unsupported file type");
    };

    const handleParse = async () => {
        setIsProcessing(true);
        setError(null);
        setStep('parsing');

        try {
            let textContent: string;

            if (inputMethod === 'file' && selectedFile) {
                textContent = await processFile(selectedFile);
            } else if (inputMethod === 'paste' && pastedText.trim()) {
                textContent = pastedText;
                setContentType('text');
            } else {
                throw new Error("No content provided");
            }

            const result = await parseResumeWithAI(textContent, contentType);

            if (result.error) {
                throw new Error(result.error);
            }

            if (result.data) {
                setParseResult(result.data);
                setEditedData(result.data.parsed);
                setStep('review');
            }
        } catch (e: any) {
            setError(e.message || "Failed to parse resume");
            setStep('input');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (editedData && parseResult) {
            onImport(editedData, contentType, parseResult.confidence.overall);
            handleClose();
        }
    };

    // Edit handlers for the review step
    const updateProfile = (field: keyof ResumeData['profile'], value: string | number) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            profile: { ...editedData.profile, [field]: value }
        });
    };

    const updateExperience = (index: number, field: keyof ResumeExperience, value: string) => {
        if (!editedData) return;
        const newExp = [...editedData.experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setEditedData({ ...editedData, experience: newExp });
    };

    const updateCompetency = (index: number, skills: string[]) => {
        if (!editedData) return;
        const newComp = [...editedData.competencies];
        newComp[index] = { ...newComp[index], skills };
        setEditedData({ ...editedData, competencies: newComp });
    };

    const updateEducation = (index: number, field: keyof ResumeEducation, value: string) => {
        if (!editedData) return;
        const newEdu = [...editedData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setEditedData({ ...editedData, education: newEdu });
    };

    const renderInputStep = () => (
        <div className="space-y-6">
            {/* Method Toggle - Segmented Control Style */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setInputMethod('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${inputMethod === 'file'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Upload size={16} weight={inputMethod === 'file' ? 'fill' : 'regular'} />
                    Upload File
                    {inputMethod === 'file' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                </button>
                <button
                    onClick={() => setInputMethod('paste')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${inputMethod === 'paste'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <ClipboardText size={16} weight={inputMethod === 'paste' ? 'fill' : 'regular'} />
                    Paste Text
                    {inputMethod === 'paste' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                    )}
                </button>
            </div>

            {inputMethod === 'file' ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {selectedFile ? (
                        <div className="space-y-2">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                                <FileText size={24} weight="duotone" className="text-primary" />
                            </div>
                            <p className="font-medium text-foreground">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                }}
                                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto">
                                <Upload size={24} weight="duotone" className="text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Drop your resume here</p>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Supports PDF, DOCX, TXT
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="resume-text">Paste your resume text</Label>
                    <Textarea
                        id="resume-text"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Copy and paste your resume content here..."
                        className="min-h-[250px] font-mono text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        {pastedText.length > 0 && `${pastedText.length} characters`}
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <Warning size={16} weight="bold" />
                    {error}
                </div>
            )}
        </div>
    );

    const renderParsingStep = () => (
        <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                <Sparkle size={32} weight="fill" className="text-primary" />
            </div>
            <div>
                <p className="font-medium text-foreground">Parsing your resume...</p>
                <p className="text-sm text-muted-foreground mt-1">
                    AI is extracting structured information
                </p>
            </div>
            <div className="w-48 h-1 bg-secondary rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
            </div>
        </div>
    );

    const renderReviewStep = () => {
        if (!parseResult || !editedData) return null;

        return (
            <div className="space-y-6 -mx-6">
                {/* Confidence Overview */}
                <div className="px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ConfidenceIndicator score={parseResult.confidence.overall} size="lg" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Review and edit before saving
                    </p>
                </div>

                {/* Warnings */}
                {parseResult.warnings.length > 0 && (
                    <div className="px-6">
                        <WarningBanner warnings={parseResult.warnings} />
                    </div>
                )}

                <ScrollArea className="h-[400px]">
                    <div className="px-6 space-y-6">
                        {/* Profile Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    Profile
                                    <ConfidenceBadge score={parseResult.confidence.profile} section="Profile" />
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Profession</Label>
                                    <Input
                                        value={editedData.profile.profession}
                                        onChange={(e) => updateProfile('profession', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Years of Experience</Label>
                                    <Input
                                        type="number"
                                        value={editedData.profile.yearsOfExperience}
                                        onChange={(e) => updateProfile('yearsOfExperience', parseInt(e.target.value) || 0)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Location</Label>
                                    <Input
                                        value={editedData.profile.location}
                                        onChange={(e) => updateProfile('location', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Email</Label>
                                    <Input
                                        value={editedData.profile.email}
                                        onChange={(e) => updateProfile('email', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Phone</Label>
                                    <Input
                                        value={editedData.profile.phone}
                                        onChange={(e) => updateProfile('phone', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">LinkedIn</Label>
                                    <Input
                                        value={editedData.profile.linkedin || ""}
                                        onChange={(e) => updateProfile('linkedin', e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Experience Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    Experience ({editedData.experience.length})
                                    <ConfidenceBadge score={parseResult.confidence.experience} section="Experience" />
                                </h4>
                            </div>
                            <div className="space-y-4">
                                {editedData.experience.map((exp, idx) => (
                                    <div key={exp.id} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={exp.company}
                                                onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                                                placeholder="Company"
                                                className="h-8 text-sm"
                                            />
                                            <Input
                                                value={exp.role}
                                                onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                                                placeholder="Role"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <Input
                                            value={exp.dates}
                                            onChange={(e) => updateExperience(idx, 'dates', e.target.value)}
                                            placeholder="Dates"
                                            className="h-8 text-sm"
                                        />
                                        <Textarea
                                            value={exp.description}
                                            onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                                            placeholder="Description"
                                            className="min-h-[60px] text-xs"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Competencies Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    Skills
                                    <ConfidenceBadge score={parseResult.confidence.competencies} section="Skills" />
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {editedData.competencies.map((comp, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <Label className="text-xs">{comp.category}</Label>
                                        <Input
                                            value={comp.skills.join(', ')}
                                            onChange={(e) => updateCompetency(idx, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                            placeholder="Skills (comma separated)"
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    Education ({editedData.education.length})
                                    <ConfidenceBadge score={parseResult.confidence.education} section="Education" />
                                </h4>
                            </div>
                            <div className="space-y-3">
                                {editedData.education.map((edu, idx) => (
                                    <div key={edu.id} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                                        <Input
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                                            placeholder="Degree"
                                            className="h-8 text-sm"
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input
                                                value={edu.institution}
                                                onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                                                placeholder="Institution"
                                                className="h-8 text-sm col-span-2"
                                            />
                                            <Input
                                                value={edu.year || ""}
                                                onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                                                placeholder="Year"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    Summary
                                    <ConfidenceBadge score={parseResult.confidence.summary} section="Summary" />
                                </h4>
                            </div>
                            <Textarea
                                value={editedData.generatedSummary}
                                onChange={(e) => setEditedData({ ...editedData, generatedSummary: e.target.value })}
                                placeholder="Professional summary"
                                className="min-h-[80px] text-sm"
                            />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    };

    const canProceed = () => {
        if (step === 'input') {
            return (inputMethod === 'file' && selectedFile) || (inputMethod === 'paste' && pastedText.trim().length > 50);
        }
        return true;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-neutral-950 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Upload size={18} weight="bold" className="text-primary" />
                        </div>
                        Import Resume
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'input' && "Upload a file or paste your resume text"}
                        {step === 'parsing' && "AI is analyzing your resume..."}
                        {step === 'review' && "Review and edit the extracted information"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4">
                    {step === 'input' && renderInputStep()}
                    {step === 'parsing' && renderParsingStep()}
                    {step === 'review' && renderReviewStep()}
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t">
                    {step === 'review' ? (
                        <>
                            <Button variant="outline" onClick={() => setStep('input')}>
                                <ArrowLeft size={16} className="mr-2" />
                                Back
                            </Button>
                            <Button onClick={handleConfirm}>
                                <Check size={16} className="mr-2" />
                                Apply to Resume
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                                Cancel
                            </Button>
                            <Button onClick={handleParse} disabled={!canProceed() || isProcessing}>
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkle size={16} weight="fill" className="mr-2" />
                                        Parse with AI
                                        <ArrowRight size={16} className="ml-2" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
