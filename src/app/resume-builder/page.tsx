import ResumeBuilder from "./ResumeBuilder";

export default async function Page({ searchParams }: { searchParams: Promise<{ versionId?: string; source?: string; applicationId?: string; openTailoring?: string }> }) {
    const params = await searchParams;
    return (
        <ResumeBuilder
            versionId={params.versionId}
            source={params.source}
            applicationId={params.applicationId}
            openTailoring={params.openTailoring === 'true'}
        />
    );
}
