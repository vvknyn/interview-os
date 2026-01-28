"use client";

import { ResumeData, ResumeExperience } from "@/types/resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, Plus } from "lucide-react";

interface ExperienceBuilderProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function ExperienceBuilder({ data, update }: ExperienceBuilderProps) {
    const experiences = data.experience;

    const addExperience = () => {
        const newExperience: ResumeExperience = {
            id: crypto.randomUUID(),
            company: "",
            role: "",
            dates: "",
            description: "",
        };
        update({ experience: [...experiences, newExperience] });
    };

    const removeExperience = (id: string) => {
        update({ experience: experiences.filter((exp) => exp.id !== id) });
    };

    const updateExperience = (id: string, field: keyof ResumeExperience, value: string) => {
        update({
            experience: experiences.map((exp) =>
                exp.id === id ? { ...exp, [field]: value } : exp
            ),
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Professional Experience</h2>
                <p className="text-gray-500">
                    List your relevant experience. Focus on your impact.
                </p>
            </div>

            <div className="space-y-4">
                {experiences.map((exp, index) => (
                    <Card key={exp.id}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-lg">Position {index + 1}</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeExperience(exp.id)}
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input
                                        placeholder="Company Name"
                                        value={exp.company}
                                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input
                                        placeholder="Job Title"
                                        value={exp.role}
                                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Dates</Label>
                                    <Input
                                        placeholder="e.g. Jan 2020 - Present"
                                        value={exp.dates}
                                        onChange={(e) => updateExperience(exp.id, "dates", e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Description (Impact Obsessed)</Label>

                                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-2 border border-blue-100">
                                        <strong>The Impact Formula:</strong> Started with a [Strong Action Verb] + [Specific Task] + [Quantifiable Result].
                                        <br />
                                        <div className="mt-1 space-y-1">
                                            <em>Generic Example: "Improved [Metric] by [X]% by initiating [Action]."</em>
                                            <br />
                                            {(() => {
                                                const loc = data.profile.location?.toLowerCase() || "";
                                                let currency = "$";
                                                if (loc.includes("uk") || loc.includes("london") || loc.includes("britain")) currency = "£";
                                                else if (loc.includes("india") || loc.includes("delhi") || loc.includes("mumbai") || loc.includes("bangalore")) currency = "₹";
                                                else if (loc.includes("europe") || loc.includes("germany") || loc.includes("france") || loc.includes("paris") || loc.includes("berlin")) currency = "€";

                                                return <em>Financial Example: "Generated {currency}50k in annual revenue by optimizing sales funnels."</em>
                                            })()}
                                        </div>
                                    </div>
                                    <Textarea
                                        placeholder={`e.g. Led a team of 5 and increased efficiency by 20%...`}
                                        className="min-h-[120px]"
                                        value={exp.description}
                                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button onClick={addExperience} variant="outline" className="w-full py-6 border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                Add Position
            </Button>
        </div>
    );
}
