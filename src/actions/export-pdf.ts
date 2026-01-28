"use server";

import { jsPDF } from "jspdf";
import { generateGenericText } from "./generate-context";

interface PDFExportData {
    company: string;
    round: string;
    reconData: any;
    matchData: any;
    questionsData: any;
    reverseData: any;
    resume: string;
    stories: string;
}

export async function exportToPDF(data: PDFExportData): Promise<{ success: boolean; error?: string; pdf?: string }> {
    try {
        const { company, round, reconData, matchData, questionsData, reverseData, resume, stories } = data;

        // Generate strategic answers for all questions in parallel
        const strategicAnswers: { [key: string]: string } = {};

        if (questionsData?.questions) {
            const fullContext = `RESUME SUMMARY:\n${resume}\n\nADDITIONAL STORIES:\n${stories}`;

            const answerPromises = questionsData.questions.map(async (question: string) => {
                const prompt = `
                    Context: Vivek is interviewing at ${company}.
                    Question: "${question}"
                    Full Resume & Data: ${fullContext}
                    Task: Select the best story from the Resume Context that answers this specific question.
                    
                    CRITICAL INSTRUCTION: You MUST find a connection, even if it is distant or abstract.
                    - NEVER say "there isn't a direct story" or "no specific experience".
                    - If no direct match exists, pivot to a related soft skill (e.g., adaptability, problem-solving, rapid learning) from the resume and frame it as the answer.
                    - Be creative and persuasive. Your goal is to help Vivek answer this question using *something* from his background.

                    Write a short STAR method outline. Format: Use plain text with S/T/A/R headers.
                    Keep it concise - max 150 words.
                `;
                const answer = await generateGenericText(prompt);
                return { question, answer };
            });

            const answers = await Promise.all(answerPromises);
            answers.forEach(({ question, answer }) => {
                strategicAnswers[question] = answer;
            });
        }

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let yPos = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);

        // Helper function to add text with word wrap
        const addText = (text: string, fontSize: number, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            pdf.setTextColor(color[0], color[1], color[2]);

            const lines = pdf.splitTextToSize(text, maxWidth);
            lines.forEach((line: string) => {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = 20;
                }
                pdf.text(line, margin, yPos);
                yPos += fontSize * 0.5;
            });
            yPos += 3;
        };

        const addSection = (title: string) => {
            yPos += 5;
            if (yPos > pageHeight - 30) {
                pdf.addPage();
                yPos = 20;
            }
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPos - 5, maxWidth, 8, 'F');
            addText(title, 14, true, [0, 0, 0]);
            yPos += 2;
        };

        // Title
        addText(`Interview Preparation: ${company}`, 18, true, [0, 0, 0]);
        addText(`Round: ${round.toUpperCase()}`, 12, false, [100, 100, 100]);
        yPos += 5;

        // Company Recon
        if (reconData) {
            addSection('Company Overview');
            if (reconData.name) addText(`Company: ${reconData.name}`, 11, true);
            if (reconData.industry) addText(`Industry: ${reconData.industry}`, 10);
            if (reconData.ticker) addText(`Ticker: ${reconData.ticker}`, 10);
            if (reconData.vibe) addText(`Culture: ${reconData.vibe}`, 10);
            if (reconData.description) {
                yPos += 2;
                addText(reconData.description.replace(/[*#]/g, ''), 9);
            }
        }

        // Match Section
        if (matchData) {
            addSection('Your Profile Match');
            if (matchData.headline) addText(matchData.headline, 11, true);
            if (matchData.matched_entities?.length > 0) {
                addText(`Key Experiences: ${matchData.matched_entities.join(', ')}`, 10);
            }
            if (matchData.reasoning) {
                yPos += 2;
                addText(matchData.reasoning.replace(/[*#]/g, ''), 9);
            }
        }

        // Questions with Strategic Answers
        if (questionsData?.questions) {
            addSection('Interview Questions & Strategic Answers');
            questionsData.questions.forEach((question: string, index: number) => {
                if (yPos > pageHeight - 40) {
                    pdf.addPage();
                    yPos = 20;
                }
                addText(`Q${index + 1}: ${question}`, 10, true);
                const answer = strategicAnswers[question] || 'Strategy not generated';
                addText(answer.replace(/[*#<>]/g, ''), 9, false, [50, 50, 50]);
                yPos += 3;
            });
        }

        // Reverse Questions
        if (reverseData?.reverse_questions) {
            addSection('Questions to Ask the Interviewer');
            reverseData.reverse_questions.forEach((question: string, index: number) => {
                addText(`${index + 1}. ${question}`, 10);
            });
        }

        // Market Intel
        if (reconData?.business_model || reconData?.competitors) {
            addSection('Market Intelligence');
            if (reconData.business_model) {
                addText('Business Model:', 10, true);
                addText(reconData.business_model.replace(/[*#]/g, ''), 9);
            }
            if (reconData.competitors?.length > 0) {
                yPos += 2;
                addText('Key Competitors:', 10, true);
                addText(reconData.competitors.join(', '), 9);
            }
        }

        // Convert to base64
        const pdfBase64 = pdf.output('datauristring');

        return { success: true, pdf: pdfBase64 };
    } catch (error: any) {
        console.error('PDF Export Error:', error);
        return { success: false, error: error.message || 'Failed to generate PDF' };
    }
}
