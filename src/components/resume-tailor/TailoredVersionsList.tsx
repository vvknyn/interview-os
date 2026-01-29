import { useState, useEffect } from "react";
import { TailoredResumeVersion } from "@/types/resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchTailoredVersions, deleteTailoredVersion } from "@/actions/tailor-resume";
import { FileText, Trash2, Calendar } from "lucide-react";

export function TailoredVersionsList() {
    const [versions, setVersions] = useState<TailoredResumeVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadVersions = async () => {
        setIsLoading(true);
        const result = await fetchTailoredVersions();
        if (result.data) {
            setVersions(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadVersions();
    }, []);

    const handleDelete = async (versionId: string) => {
        if (!confirm("Are you sure you want to delete this version?")) return;

        const result = await deleteTailoredVersion(versionId);
        if (!result.error) {
            setVersions(versions.filter(v => v.id !== versionId));
        }
    };

    return (
        <Card className="sticky top-6">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Saved Versions
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {isLoading ? (
                    <div className="text-sm text-gray-500 text-center py-8">Loading versions...</div>
                ) : versions.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                        No saved versions yet. Create tailored versions to see them here.
                    </div>
                ) : (
                    versions.map((version) => (
                        <Card key={version.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm truncate">
                                            {version.versionName}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {version.companyName} • {version.positionTitle}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => version.id && handleDelete(version.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {version.createdAt && new Date(version.createdAt).toLocaleDateString()}
                                </div>

                                <Badge variant="secondary" className="text-xs">
                                    {version.recommendations?.length || 0} recommendations applied
                                </Badge>
                            </CardContent>
                        </Card>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
