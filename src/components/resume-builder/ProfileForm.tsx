"use client";

import { ResumeData } from "@/types/resume";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Briefcase, MapPin, Envelope, Phone, LinkedinLogo, Clock, AddressBook } from "@phosphor-icons/react";

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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Identity Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <User size={20} weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Professional Identity</h2>
                        <p className="text-sm text-muted-foreground">Who you are and what you do.</p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 p-1">
                    <div className="space-y-2">
                        <Label htmlFor="profession">Target Profession</Label>
                        <div className="relative group">
                            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="profession"
                                placeholder="e.g. Product Manager"
                                value={data.profile.profession}
                                onChange={(e) => handleChange("profession", e.target.value)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="yoe">Years of Experience</Label>
                        <div className="relative group">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="yoe"
                                type="number"
                                placeholder="e.g. 5"
                                value={data.profile.yearsOfExperience || ""}
                                onChange={(e) => handleChange("yearsOfExperience", parseInt(e.target.value) || 0)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Contact Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <AddressBook size={20} weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Contact Details</h2>
                        <p className="text-sm text-muted-foreground">How recruiters can reach you.</p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 p-1">
                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="location"
                                placeholder="e.g. San Francisco, CA"
                                value={data.profile.location}
                                onChange={(e) => handleChange("location", e.target.value)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative group">
                            <Envelope className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={data.profile.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                value={data.profile.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <div className="relative group">
                            <LinkedinLogo className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="linkedin"
                                placeholder="linkedin.com/in/..."
                                value={data.profile.linkedin || ""}
                                onChange={(e) => handleChange("linkedin", e.target.value)}
                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
