import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportResumeToPDF = async (resumeElement: HTMLElement, filename: string = 'Resume.pdf') => {
    try {
        // Create canvas from the resume element
        const canvas = await html2canvas(resumeElement, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: (document) => {
                // Fix any oklch/lab colors that html2canvas can't handle
                const styles = document.querySelectorAll('*');
                styles.forEach((el: Element) => {
                    if (el instanceof HTMLElement) {
                        const computedStyle = window.getComputedStyle(el);
                        // Force standard colors
                        if (computedStyle.backgroundColor && (computedStyle.backgroundColor.includes('oklch') || computedStyle.backgroundColor.includes('lab'))) {
                            el.style.backgroundColor = '#ffffff';
                        }
                        if (computedStyle.color && (computedStyle.color.includes('oklch') || computedStyle.color.includes('lab'))) {
                            el.style.color = '#000000';
                        }
                    }
                });
            }
        });

        // Calculate dimensions for PDF (8.5 x 11 inches)
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        let heightLeft = imgHeight;
        let position = 0;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Download the PDF
        pdf.save(filename);

        return { success: true };
    } catch (error) {
        console.error('PDF export error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' };
    }
};
