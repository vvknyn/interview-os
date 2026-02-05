import ResumeBuilder from "./ResumeBuilder";

export default async function Page({ searchParams }: { searchParams: Promise<{ versionId?: string }> }) {
    const params = await searchParams;
    return <ResumeBuilder versionId={params.versionId} />;
}
