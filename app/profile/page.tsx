"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user, updateUserProfile } = useAuth();
    const [name, setName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.displayName || "");
            setPhotoURL(user.photoURL || "");
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await updateUserProfile(name, photoURL);
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const generateRandomAvatar = () => {
        const randomId = Math.floor(Math.random() * 10000);
        setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}`);
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details and public avatar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="flex flex-col items-center sm:flex-row gap-6">
                            <Avatar className="w-24 h-24 border-2 border-gray-100">
                                <AvatarImage src={photoURL} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                                <Button type="button" variant="outline" size="sm" onClick={generateRandomAvatar}>
                                    Generate Random Avatar
                                </Button>
                                <p className="text-xs text-gray-500">
                                    Or paste a custom image URL below.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="photoURL">Avatar URL</Label>
                            <Input
                                id="photoURL"
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
