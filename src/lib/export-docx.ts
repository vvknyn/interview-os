import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopPosition, TabStopType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { ResumeData } from "@/types/resume";

export const exportToDocx = async (data: ResumeData) => {
    // Styles
    const HEADING_FONT_SIZE = 28; // 14pt
    const BODY_FONT_SIZE = 22; // 11pt
    const FONT_FAMILY = "Calibri";

    // 1. Header Section
    const headerParagraphs = [
        new Paragraph({
            text: data.profile.profession?.toUpperCase() || "YOUR NAME",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            border: {
                bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            run: {
                font: FONT_FAMILY,
                size: 32,
                bold: true,
            }
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: data.profile.location || "", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                new TextRun({ text: " • ", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                new TextRun({ text: data.profile.phone || "", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                new TextRun({ text: " • ", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                new TextRun({ text: data.profile.email || "", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                ...(data.profile.linkedin ? [
                    new TextRun({ text: " • ", font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                    new TextRun({ text: data.profile.linkedin.replace(/^https?:\/\//, ''), font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                ] : [])
            ],
            spacing: { after: 300 },
        }),
    ];

    // 2. Summary Section
    const summarySection = [
        new Paragraph({
            text: "PROFESSIONAL SUMMARY",
            heading: HeadingLevel.HEADING_3,
            border: {
                bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 4 },
            },
            spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: data.generatedSummary || "",
                    font: FONT_FAMILY,
                    size: BODY_FONT_SIZE,
                }),
            ],
            spacing: { after: 300 },
        }),
    ];

    // 3. Competencies Table (3 Columns)
    const competenciesRows = [];
    const compCount = data.competencies.length;
    // Transpose logic if we want them side by side? 
    // Actually, we can just make a single row with 3 cells if appropriate, or list them.
    // The layout usually is:
    // Cat 1     Cat 2     Cat 3
    // - Skill   - Skill   - Skill

    // Let's build a single row table for the categories
    const competenciesCells = data.competencies.map(cat => (
        new TableCell({
            width: { size: 100 / compCount, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [
                new Paragraph({
                    children: [new TextRun({ text: cat.category, bold: true, font: FONT_FAMILY, size: BODY_FONT_SIZE })],
                    spacing: { after: 100 },
                }),
                ...cat.skills.slice(0, 8).map(skill => new Paragraph({
                    bullet: { level: 0 },
                    children: [new TextRun({ text: skill, font: FONT_FAMILY, size: BODY_FONT_SIZE })]
                }))
            ],
        })
    ));

    const competenciesSection = [
        new Paragraph({
            text: "CORE COMPETENCIES",
            heading: HeadingLevel.HEADING_3,
            border: {
                bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 4 },
            },
            spacing: { before: 200, after: 120 },
        }),
        new Table({
            rows: [new TableRow({ children: competenciesCells })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        }),
        new Paragraph({ text: "", spacing: { after: 300 } }) // Spacer
    ];

    // 4. Experience Section
    const experienceSection = [
        new Paragraph({
            text: "PROFESSIONAL EXPERIENCE",
            heading: HeadingLevel.HEADING_3,
            border: {
                bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 4 },
            },
            spacing: { before: 200, after: 120 },
        }),
        ...data.experience.flatMap(exp => [
            // Role + Date line
            new Paragraph({
                children: [
                    new TextRun({ text: exp.role, bold: true, font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                    new TextRun({
                        text: `\t${exp.dates}`,
                        bold: false,
                        font: FONT_FAMILY,
                        size: BODY_FONT_SIZE,
                    }),
                ],
                tabStops: [
                    { type: TabStopType.RIGHT, position: TabStopPosition.MAX }
                ],
                spacing: { before: 120 },
            }),
            // Company
            new Paragraph({
                children: [new TextRun({ text: exp.company, bold: true, italics: true, font: FONT_FAMILY, size: BODY_FONT_SIZE })],
                spacing: { after: 120 },
            }),
            // Bullets (split by newline)
            ...exp.description.split('\n').filter(line => line.trim()).map(line =>
                new Paragraph({
                    text: line.trim().replace(/^[-•]\s*/, ''), // Remove existing markers if user typed them
                    bullet: { level: 0 },
                    children: [new TextRun({ text: line.trim().replace(/^[-•]\s*/, ''), font: FONT_FAMILY, size: BODY_FONT_SIZE })],
                })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }) // Spacer between jobs
        ])
    ];

    // 5. Education Section
    const educationSection = [
        new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_3,
            border: {
                bottom: { color: "999999", space: 1, style: BorderStyle.SINGLE, size: 4 },
            },
            spacing: { before: 200, after: 120 },
        }),
        new Paragraph({
            children: [
                new TextRun({ text: "Degree Name, Major", bold: true, font: FONT_FAMILY, size: BODY_FONT_SIZE }),
                new TextRun({
                    text: `\tYear`,
                    bold: false,
                    font: FONT_FAMILY,
                    size: BODY_FONT_SIZE,
                }),
            ],
            tabStops: [
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX }
            ],
        }),
        new Paragraph({
            children: [new TextRun({ text: "University / Institution Name", font: FONT_FAMILY, size: BODY_FONT_SIZE })],
        })
    ]

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    ...headerParagraphs,
                    ...summarySection,
                    ...competenciesSection,
                    ...experienceSection,
                    ...educationSection
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Resume.docx");
};
