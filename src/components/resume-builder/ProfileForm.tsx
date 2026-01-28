"use client";

import { ResumeData } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileFormProps {
    data: ResumeData;
    update: (data: Partial<ResumeData>) => void;
}

export function ProfileForm({ data, update }: ProfileFormProps) {
    const handleChange = (field: keyof ResumeData["profile"], value: string | number) => {
        update({
            profile: {
                ...data.profile,
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold">The Basics</h2>
                <p className="text-gray-500">Let's start with your professional identity and contact info.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="profession">Target Profession</Label>
                    <Input
                        id="profession"
                        placeholder="e.g. Product Manager"
                        value={data.profile.profession}
                        onChange={(e) => handleChange("profession", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="yoe">Years of Experience</Label>
                    <Input
                        id="yoe"
                        type="number"
                        placeholder="e.g. 5"
                        value={data.profile.yearsOfExperience || ""}
                        onChange={(e) => handleChange("yearsOfExperience", parseInt(e.target.value) || 0)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        placeholder="e.g. San Francisco, CA"
                        value={data.profile.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={data.profile.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={data.profile.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                        id="linkedin"
                        placeholder="linkedin.com/in/..."
                        value={data.profile.linkedin || ""}
                        onChange={(e) => handleChange("linkedin", e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
