"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, signInAsGuest, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      setIsRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="secondary"
            className="w-full h-12 text-base"
            onClick={signInAsGuest}
          >
            <User className="mr-2 h-5 w-5" />
            Continue as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
