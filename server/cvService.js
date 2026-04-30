import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType, BorderStyle } from 'docx';

/**
 * Senior Level CV Generation Service
 * Focuses on ATS compatibility, input validation, and clean architecture.
 */
export const generateCVBuffer = async (data, user, projects) => {
  // Input Validation (Security First)
  if (!user || !user.name) {
    throw new Error('User identification is required for CV generation.');
  }

  // Sanitize data (Simplified for example, but ensures structure)
  const cvData = {
    summary: data.summary || '',
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    certificates: Array.isArray(data.certificates) ? data.certificates : []
  };

  const doc = new Document({
    title: `${user.name} CV`,
    description: `Professional CV for ${user.name}`,
    sections: [{
      properties: {
        type: SectionType.CONTINUOUS,
      },
      children: [
        // Header (Technical Identity)
        new Paragraph({
          text: user.name.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: `${user.specialty || 'Mütəxəssis'}`,
              bold: true,
              color: "D97706",
              size: 24,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: `${user.email} | ${user.phone || ''} | ${user.linkedinLink || ''}`,
              size: 18,
              color: "6B7280",
            }),
          ],
          spacing: { after: 400 },
        }),

        // Profile Section
        ...(cvData.summary ? [
          new Paragraph({ 
            text: "PROFESSIONAL PROFILE", 
            heading: HeadingLevel.HEADING_2, 
            border: { bottom: { color: "D97706", space: 1, value: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({ text: cvData.summary, spacing: { after: 300 } }),
        ] : []),

        // Experience Section
        new Paragraph({ 
          text: "WORK EXPERIENCE", 
          heading: HeadingLevel.HEADING_2, 
          border: { bottom: { color: "D97706", space: 1, value: BorderStyle.SINGLE, size: 12 } },
          spacing: { before: 200, after: 100 }
        }),
        ...cvData.experience.flatMap(exp => {
           if(!exp.position || !exp.company) return [];
           return [
              new Paragraph({
                children: [
                  new TextRun({ text: exp.position, bold: true, size: 22 }),
                  new TextRun({ text: `\t${exp.period}`, bold: true, color: "D97706" }),
                ],
                tabStops: [{ type: "right", position: 9000 }],
              }),
              new Paragraph({ 
                children: [new TextRun({ text: exp.company, italic: true, color: "4B5563" })],
                spacing: { after: 80 } 
              }),
              new Paragraph({ text: exp.desc || '', spacing: { after: 200 } }),
           ];
        }),

        // Education Section
        new Paragraph({ 
          text: "EDUCATION", 
          heading: HeadingLevel.HEADING_2, 
          border: { bottom: { color: "D97706", space: 1, value: BorderStyle.SINGLE, size: 12 } },
          spacing: { before: 200, after: 100 }
        }),
        ...cvData.education.flatMap(edu => {
           if(!edu.school) return [];
           return [
              new Paragraph({
                children: [
                  new TextRun({ text: edu.school, bold: true, size: 22 }),
                  new TextRun({ text: `\t${edu.year || ''}`, bold: true, color: "D97706" }),
                ],
                tabStops: [{ type: "right", position: 9000 }],
              }),
              new Paragraph({ 
                text: edu.degree, 
                spacing: { after: 200 },
                children: [new TextRun({ text: edu.degree, italic: true, color: "4B5563" })]
              }),
           ];
        }),

        // Projects Section
        ...(projects && projects.length > 0 ? [
          new Paragraph({ 
            text: "RELEVANT PROJECTS", 
            heading: HeadingLevel.HEADING_2, 
            border: { bottom: { color: "D97706", space: 1, value: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 100 }
          }),
          ...projects.flatMap(proj => [
            new Paragraph({
              children: [
                new TextRun({ text: proj.title, bold: true, size: 22 }),
                new TextRun({ text: `\t${proj.tech}`, italic: true, color: "D97706" }),
              ],
              tabStops: [{ type: "right", position: 9000 }],
            }),
            new Paragraph({ text: proj.description || '', spacing: { after: 150 } }),
          ])
        ] : []),

        // Technical Skills
        new Paragraph({ 
          text: "TECHNICAL SKILLS & COMPETENCIES", 
          heading: HeadingLevel.HEADING_2, 
          border: { bottom: { color: "D97706", space: 1, value: BorderStyle.SINGLE, size: 12 } },
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Soft Skills: ", bold: true }),
            new TextRun(user.softSkills || 'N/A'),
          ],
          spacing: { before: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Technical Skills: ", bold: true }),
            new TextRun(user.computerSkills || 'N/A'),
          ],
          spacing: { after: 200 }
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
};
