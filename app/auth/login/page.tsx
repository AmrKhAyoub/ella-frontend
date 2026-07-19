"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

export default function LoginPage() {
    const router = useRouter();

    // 1. Changed 'username' to 'email' here
    const [formData, setFormData] = useState({
        email: "", 
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const baseUrl = "https://ella-v1.onrender.com";
            
            const response = await fetch(`${baseUrl}/api/auth/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData), // Now sends {"email": "...", "password": "..."}
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Login failed:", data);
                // Look for common Django error keys, now checking for email errors too
                const errorMessage = data.detail 
                    || (data.email && data.email[0]) 
                    || (data.non_field_errors && data.non_field_errors[0])
                    || "Invalid email or password.";
                    
                throw new Error(errorMessage);
            }

            // Store the JWT tokens
            localStorage.setItem("accessToken", data.access);
            localStorage.setItem("refreshToken", data.refresh);

            // Redirect to the dashboard
            router.push("/main/chat"); 

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <form
                onSubmit={handleSubmit}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
            >
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link href="/" aria-label="go home" className="mx-auto block w-fit">
                            <Image src={logo} alt="Logo" width={50} height={50} priority />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Sign In to Ella</h1>
                        <p className="text-sm">Welcome back! Sign in to continue</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            {/* 2. Changed back to email type, name, id, and value */}
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm">
                                    Password
                                </Label>
                                <Button asChild variant="link" size="sm">
                                    <Link href="#" className="link intent-info variant-ghost text-sm">
                                        Forgot your Password?
                                    </Link>
                                </Button>
                            </div>
                            <Input
                                type="password"
                                required
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="input sz-md variant-mixed"
                            />
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Don't have an account?
                        <Button asChild variant="link" className="px-2">
                            <Link href="/auth/signup">Create account</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    );
}