/**
 * Git-like diff system for resume versions
 * Only stores changes (deltas) instead of full copies
 */

import { ResumeExperience, ResumeCompetencyCategory, ResumeEducation, ResumeProfile } from "@/types/resume";

export interface ResumeDiff {
    // What changed
    summary?: {
        type: 'add' | 'modify' | 'delete';
        before?: string;
        after?: string;
    };
    experience?: Array<{
        type: 'add' | 'modify' | 'delete';
        index?: number; // for modify/delete
        before?: ResumeExperience;
        after?: ResumeExperience;
    }>;
    competencies?: Array<{
        type: 'add' | 'modify' | 'delete';
        index?: number;
        before?: ResumeCompetencyCategory;
        after?: ResumeCompetencyCategory;
    }>;
    education?: Array<{
        type: 'add' | 'modify' | 'delete';
        index?: number;
        before?: ResumeEducation;
        after?: ResumeEducation;
    }>;
    profile?: {
        type: 'modify';
        before?: Partial<ResumeProfile>;
        after?: Partial<ResumeProfile>;
    };
}

/**
 * Generate a diff between two resume states
 */
export function createResumeDiff(
    original: {
        summary?: string;
        experience?: ResumeExperience[];
        competencies?: ResumeCompetencyCategory[];
        education?: ResumeEducation[];
        profile?: ResumeProfile;
    },
    modified: {
        summary?: string;
        experience?: ResumeExperience[];
        competencies?: ResumeCompetencyCategory[];
        education?: ResumeEducation[];
        profile?: ResumeProfile;
    }
): ResumeDiff {
    const diff: ResumeDiff = {};

    // Summary diff
    if (original.summary !== modified.summary) {
        diff.summary = {
            type: original.summary ? 'modify' : 'add',
            before: original.summary,
            after: modified.summary
        };
    }

    // Experience diff
    const expDiff = diffArrays(original.experience || [], modified.experience || [], compareExperience);
    if (expDiff.length > 0) {
        diff.experience = expDiff;
    }

    // Competencies diff
    const compDiff = diffArrays(original.competencies || [], modified.competencies || [], compareCompetency);
    if (compDiff.length > 0) {
        diff.competencies = compDiff;
    }

    // Education diff
    const eduDiff = diffArrays(original.education || [], modified.education || [], compareEducation);
    if (eduDiff.length > 0) {
        diff.education = eduDiff;
    }

    // Profile diff (only track what changed)
    if (original.profile && modified.profile) {
        const profileChanges: Partial<ResumeProfile> = {};
        const originalChanges: Partial<ResumeProfile> = {};
        let hasChanges = false;

        Object.keys(modified.profile).forEach((key) => {
            const k = key as keyof ResumeProfile;
            if (original.profile![k] !== modified.profile![k]) {
                profileChanges[k] = modified.profile![k] as any;
                originalChanges[k] = original.profile![k] as any;
                hasChanges = true;
            }
        });

        if (hasChanges) {
            diff.profile = {
                type: 'modify',
                before: originalChanges,
                after: profileChanges
            };
        }
    }

    return diff;
}

/**
 * Apply a diff to a resume state
 */
export function applyResumeDiff(
    baseResume: {
        summary?: string;
        experience?: ResumeExperience[];
        competencies?: ResumeCompetencyCategory[];
        education?: ResumeEducation[];
        profile?: ResumeProfile;
    },
    diff: ResumeDiff
): typeof baseResume {
    const result = { ...baseResume };

    // Apply summary changes
    if (diff.summary) {
        result.summary = diff.summary.after;
    }

    // Apply experience changes
    if (diff.experience) {
        result.experience = [...(baseResume.experience || [])];
        diff.experience.forEach((change) => {
            if (change.type === 'add' && change.after) {
                result.experience!.push(change.after);
            } else if (change.type === 'modify' && change.index !== undefined && change.after) {
                result.experience![change.index] = change.after;
            } else if (change.type === 'delete' && change.index !== undefined) {
                result.experience!.splice(change.index, 1);
            }
        });
    }

    // Apply competency changes
    if (diff.competencies) {
        result.competencies = [...(baseResume.competencies || [])];
        diff.competencies.forEach((change) => {
            if (change.type === 'add' && change.after) {
                result.competencies!.push(change.after);
            } else if (change.type === 'modify' && change.index !== undefined && change.after) {
                result.competencies![change.index] = change.after;
            } else if (change.type === 'delete' && change.index !== undefined) {
                result.competencies!.splice(change.index, 1);
            }
        });
    }

    // Apply education changes
    if (diff.education) {
        result.education = [...(baseResume.education || [])];
        diff.education.forEach((change) => {
            if (change.type === 'add' && change.after) {
                result.education!.push(change.after);
            } else if (change.type === 'modify' && change.index !== undefined && change.after) {
                result.education![change.index] = change.after;
            } else if (change.type === 'delete' && change.index !== undefined) {
                result.education!.splice(change.index, 1);
            }
        });
    }

    // Apply profile changes
    if (diff.profile && diff.profile.after) {
        result.profile = { ...baseResume.profile, ...diff.profile.after } as ResumeProfile;
    }

    return result;
}

// Helper functions for array diffing
function diffArrays<T>(
    original: T[],
    modified: T[],
    compareFn: (a: T, b: T) => boolean
): Array<{ type: 'add' | 'modify' | 'delete'; index?: number; before?: T; after?: T }> {
    const changes: Array<{ type: 'add' | 'modify' | 'delete'; index?: number; before?: T; after?: T }> = [];

    // Find modifications and deletions
    original.forEach((item, index) => {
        const modifiedItem = modified.find((m) => compareFn(item, m));
        if (!modifiedItem) {
            // Deleted
            changes.push({ type: 'delete', index, before: item });
        } else if (JSON.stringify(item) !== JSON.stringify(modifiedItem)) {
            // Modified
            changes.push({ type: 'modify', index, before: item, after: modifiedItem });
        }
    });

    // Find additions
    modified.forEach((item) => {
        if (!original.find((o) => compareFn(o, item))) {
            changes.push({ type: 'add', after: item });
        }
    });

    return changes;
}

function compareExperience(a: ResumeExperience, b: ResumeExperience): boolean {
    return a.company === b.company && a.role === b.role && a.dates === b.dates;
}

function compareCompetency(a: ResumeCompetencyCategory, b: ResumeCompetencyCategory): boolean {
    return a.category === b.category;
}

function compareEducation(a: ResumeEducation, b: ResumeEducation): boolean {
    return a.institution === b.institution && a.degree === b.degree;
}

/**
 * Calculate size savings of using diff vs full copy
 */
export function estimateDiffSize(diff: ResumeDiff): { diffSize: number; wouldBeFull: number } {
    const diffStr = JSON.stringify(diff);
    const diffSize = new Blob([diffStr]).size;

    // Estimate full size (rough approximation)
    let fullSize = 0;
    if (diff.summary) fullSize += (diff.summary.before?.length || 0) + (diff.summary.after?.length || 0);
    if (diff.experience) fullSize += JSON.stringify(diff.experience).length * 2;
    if (diff.competencies) fullSize += JSON.stringify(diff.competencies).length * 2;
    if (diff.education) fullSize += JSON.stringify(diff.education).length * 2;

    return { diffSize, wouldBeFull: fullSize };
}
